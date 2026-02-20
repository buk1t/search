import os


def combine_included_files(
    src=".",
    out_file="combined.txt",
    clear_out=True,
):
    # --- Same exclusions as your script ---
    exclude_dirs = {'.next', 'node_modules', '.git', 'allfiles'}
    exclude_extensions = {'.png', '.wav', '.ttf',
                          '.ico', '.svg', '.ts', '.webmanifest', '.py'}
    exclude_filenames = {'.gitignore', '.DS_Store',
                         'README.md', 'combined.txt', 'simple.py'}

    src = os.path.abspath(src)
    out_file_abs = os.path.abspath(out_file)
    out_dir_abs = os.path.dirname(out_file_abs)

    # Only treat the output directory as "walk-excluded" if it's a subdirectory of src
    # (If out_dir_abs == src, we DO NOT want to skip the whole project.)
    out_dir_is_inside_src = False
    try:
        out_dir_is_inside_src = os.path.commonpath([out_dir_abs, src]) == src
    except ValueError:
        out_dir_is_inside_src = False

    exclude_dirs = set(exclude_dirs)
    if out_dir_is_inside_src and os.path.normpath(out_dir_abs) != os.path.normpath(src):
        exclude_dirs.add(os.path.basename(out_dir_abs))

    # Ensure output directory exists
    os.makedirs(out_dir_abs or ".", exist_ok=True)

    if clear_out and os.path.exists(out_file_abs):
        os.remove(out_file_abs)

    included = 0
    noted_read_issues = 0

    with open(out_file_abs, "w", encoding="utf-8", newline="\n") as out:
        for root, dirs, files in os.walk(src):
            # Skip excluded dirs
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            for file in files:
                if file in exclude_filenames:
                    continue

                if os.path.splitext(file)[1].lower() in exclude_extensions:
                    continue

                src_path = os.path.join(root, file)

                # Skip the output file itself (in case it's in-tree)
                if os.path.abspath(src_path) == out_file_abs:
                    continue

                rel_path = os.path.relpath(src_path, src)

                out.write("\n" + "=" * 90 + "\n")
                out.write(f"FILE: {rel_path}\n")
                out.write("=" * 90 + "\n\n")

                try:
                    with open(src_path, "r", encoding="utf-8", errors="replace") as f:
                        out.write(f.read())
                    out.write("\n")
                    included += 1
                except Exception as e:
                    out.write(f"[Could not read file: {e}]\n")
                    noted_read_issues += 1

    print(f"Done. Wrote {included} files into: {out_file_abs}")
    if noted_read_issues:
        print(
            f"Note: {noted_read_issues} files had read issues and were noted in the output.")


if __name__ == "__main__":
    combine_included_files(src=".", out_file="combined.txt", clear_out=True)
