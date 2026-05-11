#!/usr/bin/env python3
"""
Extract content from archived Educative HTML files into clean HTML snippets
and a JSON manifest for the React app.

Output structure:
  public/content/{chapterIndex}/{lessonIndex}.html  - cleaned lesson HTML
  public/images/{chapterIndex}/{lessonIndex}/       - extracted SVG/PNG images
  src/data/content.json                             - chapter/lesson manifest
"""

import os
import re
import sys
import json
import base64
import hashlib
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"
OUTPUT_DIR = Path(__file__).resolve().parent.parent
CONTENT_DIR = OUTPUT_DIR / "public" / "content"
IMAGES_DIR = OUTPUT_DIR / "public" / "images"
DATA_DIR = OUTPUT_DIR / "src" / "data"

UNWANTED_CLASSES = {
    "anchor-link",
}

UNWANTED_ATTRS = [
    "data-savepage-href",
    "data-savepage-src",
    "data-savepage-type",
    "data-id",
    "data-cell-column",
    "data-cell-row",
    "tabindex",
    "role",
]


def slugify(text: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text.lower().strip())
    text = re.sub(r"[-\s]+", "-", text)
    return text.strip("-")


def extract_chapter_info(dirname: str):
    match = re.match(r"^(\d+)\.\s*(.+)$", dirname)
    if not match:
        return None, None
    return int(match.group(1)), match.group(2).strip()


def extract_lesson_info(filename: str):
    name = filename.replace(".html", "")
    match = re.match(r"^(\d+)\.\s*(.+)$", name)
    if not match:
        return None, None
    return int(match.group(1)), match.group(2).strip()


def save_data_url_image(data_url: str, chapter_idx: int, lesson_idx: int, img_counter: int) -> str | None:
    """Extract a base64 data URL, save to file, return relative path."""
    match = re.match(r"data:image/([\w+]+);base64,(.+)", data_url)
    if not match:
        return None

    img_type = match.group(1).split("+")[0]
    ext = "svg" if "svg" in match.group(1) else img_type
    if ext == "jpeg":
        ext = "jpg"

    img_data = match.group(2)
    try:
        decoded = base64.b64decode(img_data)
    except Exception:
        return None

    img_dir = IMAGES_DIR / str(chapter_idx) / str(lesson_idx)
    img_dir.mkdir(parents=True, exist_ok=True)

    filename = f"img_{img_counter}.{ext}"
    img_path = img_dir / filename
    img_path.write_bytes(decoded)

    return f"/images/{chapter_idx}/{lesson_idx}/{filename}"


def clean_element(el):
    """Remove unwanted attributes and classes from an element tree."""
    if isinstance(el, NavigableString):
        return

    for attr in UNWANTED_ATTRS:
        if el.has_attr(attr):
            del el[attr]

    if el.has_attr("class"):
        el["class"] = [c for c in el["class"] if c not in UNWANTED_CLASSES]
        if not el["class"]:
            del el["class"]

    if el.has_attr("style"):
        style = el["style"]
        keep_styles = []
        for part in style.split(";"):
            part = part.strip()
            prop = part.split(":")[0].strip().lower() if ":" in part else ""
            if prop in ("background-color", "text-align", "max-width", "width", "height", "vertical-align"):
                keep_styles.append(part)
        if keep_styles:
            el["style"] = "; ".join(keep_styles)
        else:
            del el["style"]

    for child in el.find_all(True):
        clean_element(child)


def extract_viewer_html(viewer_div, chapter_idx: int, lesson_idx: int, img_counter: int) -> tuple[str, int]:
    """Extract clean HTML from a markdownViewer div."""
    viewer = viewer_div.__copy__()
    clean_element(viewer)

    for img in viewer.find_all("img"):
        src = img.get("src", "")
        if src.startswith("data:"):
            new_src = save_data_url_image(src, chapter_idx, lesson_idx, img_counter)
            if new_src:
                img["src"] = new_src
                img_counter += 1

    for span in viewer.find_all("span", class_="anchor-link"):
        span.decompose()

    inner_html = viewer.decode_contents()
    return inner_html, img_counter


def extract_widget_html(widget_div, chapter_idx: int, lesson_idx: int, img_counter: int) -> tuple[str, int]:
    """Extract image from a widget div (diagram) and return as <figure>."""
    caption_text = ""
    caption_div = widget_div.find("div", class_=lambda c: c and "sc-db5c8001" in c)
    if caption_div:
        caption_text = caption_div.get_text(strip=True)
    elif widget_div.find("span"):
        spans = widget_div.find_all("span")
        for s in spans:
            t = s.get_text(strip=True)
            if t and len(t) > 3:
                caption_text = t
                break

    obj = widget_div.find("object")
    img = widget_div.find("img")

    src = None
    if obj and obj.get("data", "").startswith("data:"):
        src = obj["data"]
    elif img and img.get("src", "").startswith("data:"):
        src = img["src"]

    if src:
        new_src = save_data_url_image(src, chapter_idx, lesson_idx, img_counter)
        if new_src:
            img_counter += 1
            caption_html = f"<figcaption>{caption_text}</figcaption>" if caption_text else ""
            return f'<figure class="diagram"><img src="{new_src}" alt="{caption_text}" loading="lazy" />{caption_html}</figure>', img_counter

    if caption_text:
        return f'<p class="caption"><em>{caption_text}</em></p>', img_counter
    return "", img_counter


def extract_table_html(table_container, chapter_idx: int, lesson_idx: int, img_counter: int) -> tuple[str, int]:
    """Extract and clean a table element."""
    table = table_container.find("table")
    if not table:
        return "", img_counter

    table_copy = table.__copy__()

    for div in table_copy.find_all("div", class_=lambda c: c and "absolute" in str(c)):
        div.decompose()

    for div in table_copy.find_all("div", class_="ql-editor"):
        div.unwrap()
    for div in table_copy.find_all("div", class_="ql-snow"):
        div.unwrap()
    for div in table_copy.find_all("div", class_="ql-container"):
        div.unwrap()

    clean_element(table_copy)
    return str(table_copy), img_counter


def save_inline_svg(svg_element, chapter_idx: int, lesson_idx: int, img_counter: int) -> str | None:
    """Save an inline <svg> element as a .svg file, return relative path."""
    svg_str = str(svg_element)
    if len(svg_str) < 200:
        return None

    img_dir = IMAGES_DIR / str(chapter_idx) / str(lesson_idx)
    img_dir.mkdir(parents=True, exist_ok=True)

    filename = f"img_{img_counter}.svg"
    img_path = img_dir / filename
    img_path.write_text(svg_str, encoding="utf-8")

    return f"/images/{chapter_idx}/{lesson_idx}/{filename}"


def extract_slide_block(container, chapter_idx: int, lesson_idx: int, img_counter: int) -> tuple[str, int]:
    """Extract Fabric.js canvas slides as individual SVG images."""
    svg_views = container.find_all("div", class_=lambda c: c and "canvas-svg-viewmode" in str(c))
    parts = []

    for sv in svg_views:
        svg = sv.find("svg")
        if not svg:
            continue
        new_src = save_inline_svg(svg, chapter_idx, lesson_idx, img_counter)
        if new_src:
            img_counter += 1
            parts.append(f'<figure class="diagram slide"><img src="{new_src}" alt="" loading="lazy" /></figure>')

    if parts:
        slide_count = len(parts)
        slides_html = "\n".join(parts)
        return f'<div class="slide-group" data-slides="{slide_count}">\n{slides_html}\n</div>', img_counter
    return "", img_counter


def extract_other_html(container, chapter_idx: int, lesson_idx: int, img_counter: int) -> tuple[str, int]:
    """Handle 'other' content blocks - check for slides first, then images."""
    # Check for Fabric.js slide blocks
    has_canvas = container.find("div", class_=lambda c: c and "canvas-svg-viewmode" in str(c))
    if has_canvas:
        return extract_slide_block(container, chapter_idx, lesson_idx, img_counter)

    imgs = container.find_all("img")
    parts = []

    for img in imgs:
        src = img.get("src", "")
        if src.startswith("data:"):
            new_src = save_data_url_image(src, chapter_idx, lesson_idx, img_counter)
            if new_src:
                img_counter += 1
                alt = img.get("alt", "")
                parts.append(f'<figure class="diagram"><img src="{new_src}" alt="{alt}" loading="lazy" /></figure>')

    objs = container.find_all("object")
    for obj in objs:
        data = obj.get("data", "")
        if data.startswith("data:"):
            new_src = save_data_url_image(data, chapter_idx, lesson_idx, img_counter)
            if new_src:
                img_counter += 1
                parts.append(f'<figure class="diagram"><img src="{new_src}" alt="" loading="lazy" /></figure>')

    if parts:
        return "\n".join(parts), img_counter

    text = container.get_text(strip=True)
    if text and len(text) > 10:
        return f"<p>{text[:500]}</p>", img_counter
    return "", img_counter


def is_toc_viewer(viewer_div) -> bool:
    """Check if a markdownViewer is a table of contents."""
    children = list(viewer_div.children)
    tag_children = [c for c in children if hasattr(c, "name") and c.name]
    if len(tag_children) == 1 and tag_children[0].name == "ul":
        links = tag_children[0].find_all("a")
        if links and all(a.get("href", "").startswith("#") for a in links):
            return True
    return False


def process_lesson(html_path: Path, chapter_idx: int, lesson_idx: int) -> dict:
    """Process a single lesson HTML file."""
    with open(html_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    h1 = soup.find("h1")
    title = h1.get_text(strip=True) if h1 else extract_lesson_info(html_path.name)[1]

    block_div = soup.find("div", class_="block")
    if not block_div:
        return {"title": title, "html": f"<h1>{title}</h1><p>Content not found.</p>"}

    children = [c for c in block_div.children if hasattr(c, "name") and c.name]

    html_parts = [f"<h1>{title}</h1>"]
    img_counter = 0

    for child in children:
        has_viewer = child.find("div", class_=lambda c: c and "markdownViewer" in c)
        has_widget = child.find("div", class_="widget") or "widget" in " ".join(child.get("class", []))
        has_table = child.find("table")

        if has_viewer:
            viewer = child.find("div", class_=lambda c: c and "markdownViewer" in c)
            if is_toc_viewer(viewer):
                continue
            content, img_counter = extract_viewer_html(viewer, chapter_idx, lesson_idx, img_counter)
            if content.strip():
                html_parts.append(content)

        elif has_widget:
            widget = child.find("div", class_="widget") if child.find("div", class_="widget") else child
            content, img_counter = extract_widget_html(widget, chapter_idx, lesson_idx, img_counter)
            if content.strip():
                html_parts.append(content)

        elif has_table:
            content, img_counter = extract_table_html(child, chapter_idx, lesson_idx, img_counter)
            if content.strip():
                html_parts.append(content)

        else:
            content, img_counter = extract_other_html(child, chapter_idx, lesson_idx, img_counter)
            if content.strip():
                html_parts.append(content)

    return {"title": title, "html": "\n".join(html_parts)}


def main():
    manifest = []

    chapter_dirs = sorted(
        [d for d in ASSETS_DIR.iterdir() if d.is_dir()],
        key=lambda d: int(re.match(r"^(\d+)", d.name).group(1)) if re.match(r"^(\d+)", d.name) else 999
    )

    total_lessons = 0
    total_images = 0

    for chapter_dir in chapter_dirs:
        chapter_idx, chapter_title = extract_chapter_info(chapter_dir.name)
        if chapter_idx is None:
            continue

        chapter_slug = slugify(chapter_title)
        chapter_data = {
            "chapterIndex": chapter_idx,
            "chapterTitle": chapter_title,
            "chapterSlug": chapter_slug,
            "lessons": [],
        }

        lesson_files = sorted(
            [f for f in chapter_dir.iterdir() if f.suffix == ".html"],
            key=lambda f: int(re.match(r"^(\d+)", f.name).group(1)) if re.match(r"^(\d+)", f.name) else 999
        )

        for lesson_file in lesson_files:
            lesson_idx, lesson_title = extract_lesson_info(lesson_file.name)
            if lesson_idx is None:
                continue

            lesson_slug = slugify(lesson_title)
            print(f"  [{chapter_idx:2d}/{lesson_idx}] {lesson_title}")

            result = process_lesson(lesson_file, chapter_idx, lesson_idx)

            content_dir = CONTENT_DIR / str(chapter_idx)
            content_dir.mkdir(parents=True, exist_ok=True)
            content_path = content_dir / f"{lesson_idx}.html"
            content_path.write_text(result["html"], encoding="utf-8")

            img_dir = IMAGES_DIR / str(chapter_idx) / str(lesson_idx)
            img_count = len(list(img_dir.iterdir())) if img_dir.exists() else 0
            total_images += img_count

            chapter_data["lessons"].append({
                "lessonIndex": lesson_idx,
                "title": result["title"],
                "slug": lesson_slug,
                "htmlFile": f"content/{chapter_idx}/{lesson_idx}.html",
            })
            total_lessons += 1

        manifest.append(chapter_data)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    manifest_path = DATA_DIR / "content.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\nDone!")
    print(f"  Chapters: {len(manifest)}")
    print(f"  Lessons:  {total_lessons}")
    print(f"  Images:   {total_images}")
    print(f"  Manifest: {manifest_path}")
    print(f"  Content:  {CONTENT_DIR}")
    print(f"  Images:   {IMAGES_DIR}")


if __name__ == "__main__":
    main()
