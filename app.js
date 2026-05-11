(function () {
  const directoryInput = document.getElementById("directoryInput");
  const fileInput = document.getElementById("fileInput");
  const pasteInput = document.getElementById("pasteInput");
  const convertButton = document.getElementById("convertButton");
  const clearButton = document.getElementById("clearButton");
  const copyButton = document.getElementById("copyButton");
  const downloadButton = document.getElementById("downloadButton");
  const htmlOutput = document.getElementById("htmlOutput");
  const preview = document.getElementById("preview");
  const status = document.getElementById("status");

  function fixBibtexEntryKeys(content) {
    return content.replace(/@(\w+)\{([^,]+),/g, function (_, type, key) {
      return "@" + type + "{" + key.replace(/\s+/g, "_") + ",";
    });
  }

  function stripOuterValue(value) {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
      return trimmed.slice(1, -1).trim();
    }
    return trimmed;
  }

  function cleanValue(value) {
    return stripOuterValue(value)
      .replace(/\s+/g, " ")
      .replace(/[{}]/g, "")
      .trim();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function findMatchingBrace(text, openIndex) {
    let depth = 0;
    let inQuote = false;

    for (let i = openIndex; i < text.length; i += 1) {
      const char = text[i];
      const previous = text[i - 1];

      if (char === '"' && previous !== "\\") {
        inQuote = !inQuote;
      }

      if (inQuote) {
        continue;
      }

      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          return i;
        }
      }
    }

    return -1;
  }

  function splitFields(body) {
    const fields = [];
    let start = 0;
    let depth = 0;
    let inQuote = false;

    for (let i = 0; i < body.length; i += 1) {
      const char = body[i];
      const previous = body[i - 1];

      if (char === '"' && previous !== "\\") {
        inQuote = !inQuote;
      }

      if (!inQuote) {
        if (char === "{") {
          depth += 1;
        } else if (char === "}") {
          depth -= 1;
        } else if (char === "," && depth === 0) {
          fields.push(body.slice(start, i));
          start = i + 1;
        }
      }
    }

    fields.push(body.slice(start));
    return fields;
  }

  function parseFields(body) {
    const fields = {};

    splitFields(body).forEach(function (part) {
      const match = part.match(/^\s*([A-Za-z][\w-]*)\s*=\s*([\s\S]*)\s*$/);
      if (!match) {
        return;
      }

      fields[match[1].toLowerCase()] = cleanValue(match[2]);
    });

    return fields;
  }

  function parseBibtex(content) {
    const fixedContent = fixBibtexEntryKeys(content);
    const entries = [];
    const entryPattern = /@(\w+)\s*\{/g;
    let match;

    while ((match = entryPattern.exec(fixedContent)) !== null) {
      const openIndex = fixedContent.indexOf("{", match.index);
      const closeIndex = findMatchingBrace(fixedContent, openIndex);

      if (closeIndex === -1) {
        throw new Error("BibTeXエントリの閉じ括弧が見つかりません。");
      }

      const entryContent = fixedContent.slice(openIndex + 1, closeIndex);
      const commaIndex = entryContent.indexOf(",");

      if (commaIndex !== -1) {
        entries.push(parseFields(entryContent.slice(commaIndex + 1)));
      }

      entryPattern.lastIndex = closeIndex + 1;
    }

    return entries;
  }

  function formatAuthors(author) {
    if (!author) {
      return "No author";
    }

    return author
      .split(/\s+and\s+/i)
      .map(function (name) {
        const parts = name.split(",").map(function (part) {
          return part.trim();
        });

        if (parts.length >= 2) {
          return parts.filter(Boolean).join(", ");
        }

        const tokens = name.trim().split(/\s+/);
        if (tokens.length >= 2) {
          return tokens[tokens.length - 1] + ", " + tokens.slice(0, -1).join(" ");
        }

        return name.trim();
      })
      .filter(Boolean)
      .join(" and ");
  }

  function entryToHtml(fields) {
    const title = fields.title || "No title";
    const authors = formatAuthors(fields.author);
    const journal = fields.journal || "No journal";
    const volume = fields.volume || "No volume";
    const number = fields.number || "No number";
    const pages = fields.pages || "No pages";
    const year = fields.year || "No year";
    const doi = fields.doi || "";
    const citation = [
      escapeHtml(title),
      escapeHtml(authors),
      escapeHtml(journal),
      "Vol. " + escapeHtml(volume),
      "No. " + escapeHtml(number),
      "pp. " + escapeHtml(pages),
      escapeHtml(year) + "."
    ].join(", ");

    if (!doi || doi === "No DOI") {
      return "<li>" + citation + "</li>";
    }

    return (
      '<li>' +
      citation +
      ' <a href="https://doi.org/' +
      encodeURI(doi) +
      '">DOI</a></li>'
    );
  }

  function buildHtml(entries) {
    return "<ul>\n" + entries.map(entryToHtml).join("\n") + "\n</ul>\n";
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle("error", Boolean(isError));
  }

  function setOutput(html) {
    htmlOutput.value = html;
    preview.innerHTML = html;
    copyButton.disabled = !html;
    downloadButton.disabled = !html;
  }

  function selectedBibFiles() {
    const files = Array.from(directoryInput.files.length ? directoryInput.files : fileInput.files);

    return files
      .filter(function (file) {
        return file.name.toLowerCase().endsWith(".bib");
      })
      .sort(function (a, b) {
        const aName = a.webkitRelativePath || a.name;
        const bName = b.webkitRelativePath || b.name;
        return bName.localeCompare(aName);
      });
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ""));
      };
      reader.onerror = function () {
        reject(reader.error);
      };
      reader.readAsText(file, "utf-8");
    });
  }

  async function convert() {
    try {
      const files = selectedBibFiles();
      const pasted = pasteInput.value.trim();
      const chunks = [];

      for (const file of files) {
        chunks.push(await readFile(file));
      }

      if (pasted) {
        chunks.push(pasted);
      }

      if (!chunks.length) {
        setOutput("");
        setStatus(".bibファイル、フォルダ、または貼り付けテキストを選んでください。", true);
        return;
      }

      const entries = chunks.flatMap(parseBibtex);

      if (!entries.length) {
        setOutput("");
        setStatus("BibTeXエントリが見つかりませんでした。", true);
        return;
      }

      setOutput(buildHtml(entries));
      setStatus(entries.length + "件のエントリをHTMLに変換しました。", false);
    } catch (error) {
      setOutput("");
      setStatus("変換に失敗しました: " + error.message, true);
    }
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(htmlOutput.value);
    setStatus("HTMLをクリップボードにコピーしました。", false);
  }

  function downloadOutput() {
    const blob = new Blob([htmlOutput.value], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "output.html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    directoryInput.value = "";
    fileInput.value = "";
    pasteInput.value = "";
    setOutput("");
    setStatus(".bibファイル、フォルダ、または貼り付けテキストを選んでください。", false);
  }

  convertButton.addEventListener("click", convert);
  clearButton.addEventListener("click", clearAll);
  copyButton.addEventListener("click", copyOutput);
  downloadButton.addEventListener("click", downloadOutput);

  window.Bib2HtmlApp = {
    buildHtml: buildHtml,
    fixBibtexEntryKeys: fixBibtexEntryKeys,
    parseBibtex: parseBibtex
  };
})();
