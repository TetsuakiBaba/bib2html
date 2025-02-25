import os
import sys
import re
from pybtex.database.input.bibtex import Parser


def fix_bibtex_entry_keys(bibtex_content):
    fixed_content = re.sub(r'@(\w+)\{([^,]+),', lambda m: '@' + m.group(
        1) + '{' + m.group(2).replace(' ', '_') + ',', bibtex_content)
    return fixed_content


def export_to_html(bib_data, html_file):
    with open(html_file, 'a', encoding='utf-8') as f:  # 既存のファイルに追記
        for entry in bib_data.entries.values():
            title = entry.fields.get('title', 'No title')
            authors = ' and '.join(str(person)
                                   for person in entry.persons.get('author', []))
            journal = entry.fields.get('journal', 'No journal')
            volume = entry.fields.get('volume', 'No volume')
            number = entry.fields.get('number', 'No number')
            pages = entry.fields.get('pages', 'No pages')
            year = entry.fields.get('year', 'No year')
            doi = entry.fields.get('doi', 'No DOI')
            f.write(
                f'<li>{title}, {authors}, {journal}, Vol. {volume}, No. {number}, pp. {pages}, {year}. <a href="https://doi.org/{doi}">DOI</a></li>\n')


def initialize_output_file(output_file):
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('<ul>\n')


def finalize_output_file(output_file):
    with open(output_file, 'a', encoding='utf-8') as f:
        f.write('</ul>\n')


def process_bib_files(directory, output_file):

    initialize_output_file(output_file)  # 出力ファイルを初期化

    bib_files = [os.path.join(root, file) for root, _, files in os.walk(
        directory) for file in files if file.endswith('.bib')]
    bib_files.sort(reverse=True)  # アルファベット順にソート

    for bib_file in bib_files:
        print(f'Processing {bib_file}')
        try:
            with open(bib_file, 'r', encoding='utf-8') as f:
                content = f.read()
                fixed_content = fix_bibtex_entry_keys(content)
                parser = Parser()
                bib_data = parser.parse_string(fixed_content)
                export_to_html(bib_data, output_file)
                # print(f'Processed {bib_file}')
        except Exception as e:
            print(f'Error processing {bib_file}: {e}')

    finalize_output_file(output_file)  # リストの終了タグを追加


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python exportHTMLListFromBibtex.py <directory>")
    else:
        directory = sys.argv[1]
        output_file = 'output.html'
        # output_fileには sys.argv[1]のファイル名で拡張子をhtmlにしたものを指定
        # output_file = sys.argv[1] + '.html'
        process_bib_files(directory, output_file)
        print(f'All data exported to {output_file}')
