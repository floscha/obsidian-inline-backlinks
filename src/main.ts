import {
    Plugin,
    MarkdownView,
    TFile,
    WorkspaceLeaf,
    setIcon,
    MarkdownRenderer,
} from "obsidian";

interface BacklinkData {
    sourcePath: string;
    sourceBasename: string;
    matchingLines: { lineNumber: number; content: string }[];
}

export default class InlineBacklinksPlugin extends Plugin {
    private currentFile: TFile | null = null;

    async onload() {
        // Register event to add backlinks when a file is opened
        this.registerEvent(
            this.app.workspace.on("file-open", (file: TFile | null) => {
                if (file) {
                    this.currentFile = file;
                    setTimeout(() => this.updateBacklinksView(file), 300);
                }
            })
        );

        // Register event for layout changes (switching between notes)
        this.registerEvent(
            this.app.workspace.on("active-leaf-change", (leaf: WorkspaceLeaf | null) => {
                if (leaf) {
                    const view = leaf.view;
                    if (view instanceof MarkdownView && view.file) {
                        this.currentFile = view.file;
                        const fileToUpdate = view.file;
                        setTimeout(() => this.updateBacklinksView(fileToUpdate), 300);
                    }
                }
            })
        );

        // Register event when metadata cache is resolved (backlinks updated)
        this.registerEvent(
            this.app.metadataCache.on("resolved", () => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    this.currentFile = activeFile;
                    setTimeout(() => this.updateBacklinksView(activeFile), 100);
                }
            })
        );

        // Also listen to layout-change for when views switch modes (reading/editing)
        this.registerEvent(
            this.app.workspace.on("layout-change", () => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    this.currentFile = activeFile;
                    setTimeout(() => this.updateBacklinksView(activeFile), 300);
                }
            })
        );

        // Initial load - check if a file is already open
        this.app.workspace.onLayoutReady(() => {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                this.currentFile = activeFile;
                setTimeout(() => this.updateBacklinksView(activeFile), 500);
            }
        });
    }

    onunload() {
        document.querySelectorAll(".inline-backlinks-container").forEach((el) => {
            el.remove();
        });
    }

    async updateBacklinksView(file: TFile) {
        const activeLeaf = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeLeaf) {
            return;
        }

        if (activeLeaf.file?.path !== file.path) {
            return;
        }

        const backlinkData = await this.getBacklinksForFile(file);
        this.renderBacklinks(activeLeaf, backlinkData);
    }

    async getBacklinksForFile(file: TFile): Promise<BacklinkData[]> {
        const backlinks: BacklinkData[] = [];

        const resolvedLinks = this.app.metadataCache.resolvedLinks;

        for (const sourcePath in resolvedLinks) {
            const linksFromSource = resolvedLinks[sourcePath];
            if (linksFromSource && linksFromSource[file.path]) {
                const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
                if (sourceFile instanceof TFile) {
                    const matchingLines = await this.findMatchingLines(sourceFile, file);

                    if (matchingLines.length > 0) {
                        backlinks.push({
                            sourcePath: sourcePath,
                            sourceBasename: sourceFile.basename,
                            matchingLines: matchingLines,
                        });
                    }
                }
            }
        }

        backlinks.sort((a, b) => a.sourceBasename.localeCompare(b.sourceBasename));
        return backlinks;
    }

    async findMatchingLines(
        sourceFile: TFile,
        targetFile: TFile
    ): Promise<{ lineNumber: number; content: string }[]> {
        const matchingLines: { lineNumber: number; content: string }[] = [];

        try {
            const content = await this.app.vault.cachedRead(sourceFile);
            const lines = content.split("\n");

            const targetBasename = targetFile.basename;
            const targetPath = targetFile.path;
            const targetPathNoExt = targetPath.replace(/\.md$/, "");

            lines.forEach((line, index) => {
                const lowerLine = line.toLowerCase();
                const lowerBasename = targetBasename.toLowerCase();
                const lowerPathNoExt = targetPathNoExt.toLowerCase();

                const hasWikilink =
                    lowerLine.includes(`[[${lowerBasename}]]`) ||
                    lowerLine.includes(`[[${lowerBasename}|`) ||
                    lowerLine.includes(`[[${lowerPathNoExt}]]`) ||
                    lowerLine.includes(`[[${lowerPathNoExt}|`);

                const hasMarkdownLink =
                    lowerLine.includes(`](${targetPath.toLowerCase()})`) ||
                    lowerLine.includes(`](${targetBasename.toLowerCase()}.md)`);

                if (hasWikilink || hasMarkdownLink) {
                    matchingLines.push({
                        lineNumber: index + 1,
                        content: line.trim(),
                    });
                }
            });
        } catch (error) {
            console.error(`Inline Backlinks: Error reading file ${sourceFile.path}:`, error);
        }

        return matchingLines;
    }

    renderBacklinks(view: MarkdownView, backlinks: BacklinkData[]) {
        // Use the view's contentEl - this is the main container for the markdown view
        const contentEl = view.contentEl;

        // Remove any existing backlinks container
        contentEl.querySelectorAll(".inline-backlinks-container").forEach(el => el.remove());

        // Don't render if no backlinks
        if (backlinks.length === 0) {
            return;
        }

        // Create backlinks container
        const container = document.createElement("div");
        container.className = "inline-backlinks-container";
    container.setAttribute("data-collapsed", "false");

        // Create header
        const header = document.createElement("div");
        header.className = "inline-backlinks-header";
    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");
    header.setAttribute("aria-expanded", "true");

        const iconSpan = document.createElement("span");
        iconSpan.className = "inline-backlinks-icon";
        setIcon(iconSpan, "link");
        header.appendChild(iconSpan);

        const countSpan = document.createElement("span");
        countSpan.className = "inline-backlinks-count";
        countSpan.textContent = `${backlinks.length} backlink${backlinks.length !== 1 ? "s" : ""}`;
        header.appendChild(countSpan);

        const toggleCollapsed = () => {
            const isCollapsed = container.classList.toggle("is-collapsed");
            container.setAttribute("data-collapsed", isCollapsed ? "true" : "false");
            header.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
        };

        header.addEventListener("click", (e) => {
            // Don't interfere with other click behaviors in the panel.
            e.preventDefault();
            toggleCollapsed();
        });

        header.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleCollapsed();
            }
        });

        container.appendChild(header);

        // Create backlinks list
        const list = document.createElement("div");
        list.className = "inline-backlinks-list";

        backlinks.forEach((backlink) => {
            const details = document.createElement("details");
            details.className = "inline-backlink-item";
            details.open = true;

            const summary = document.createElement("summary");
            summary.className = "inline-backlink-summary";
            summary.innerHTML = `<span class="inline-backlink-name">${this.escapeHtml(backlink.sourceBasename)}</span>`;

            summary.addEventListener("click", (e) => {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = this.app.vault.getAbstractFileByPath(backlink.sourcePath);
                    if (file instanceof TFile) {
                        this.app.workspace.getLeaf(true).openFile(file);
                    }
                }
            });

            details.appendChild(summary);

            const linesContainer = document.createElement("ul");
            linesContainer.className = "inline-backlink-lines";

            backlink.matchingLines.forEach((line) => {
                const lineEl = document.createElement("li");
                lineEl.className = "inline-backlink-line";

                const contentSpan = lineEl.createSpan({ cls: "inline-backlink-line-content" });
                // Render markdown content
                MarkdownRenderer.render(this.app, line.content, contentSpan, backlink.sourcePath, this);

                lineEl.addEventListener("click", async (e) => {
                    const target = e.target as HTMLElement;
                    if (target instanceof HTMLInputElement && target.type === "checkbox") {
                        e.stopPropagation();
                        const file = this.app.vault.getAbstractFileByPath(backlink.sourcePath);
                        if (file instanceof TFile) {
                            await this.toggleCheckboxInFile(file, line.lineNumber, target.checked);
                        }
                        return;
                    }

                    e.stopPropagation();
                    const file = this.app.vault.getAbstractFileByPath(backlink.sourcePath);
                    if (file instanceof TFile) {
                        const leaf = this.app.workspace.getLeaf(false);
                        await leaf.openFile(file);

                        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                        if (activeView) {
                            const editor = activeView.editor;
                            if (editor) {
                                const lineIndex = line.lineNumber - 1;
                                editor.setCursor({ line: lineIndex, ch: 0 });
                                editor.scrollIntoView(
                                    { from: { line: lineIndex, ch: 0 }, to: { line: lineIndex, ch: 0 } },
                                    true
                                );
                            }
                        }
                    }
                });

                linesContainer.appendChild(lineEl);
            });

            details.appendChild(linesContainer);
            list.appendChild(details);
        });

        container.appendChild(list);

        // Insert at the very beginning of contentEl (before any child elements)
        // This places it above both the reading view and the editing view
        contentEl.insertBefore(container, contentEl.firstChild);
    }

    async toggleCheckboxInFile(file: TFile, lineNumber: number, isChecked: boolean) {
        await this.app.vault.process(file, (content) => {
            const lines = content.split("\n");
            if (lineNumber > 0 && lineNumber <= lines.length) {
                const lineIndex = lineNumber - 1;
                const originalLine = lines[lineIndex];

                // Match checkbox: - [ ] or - [x] or * [ ] or 1. [ ] etc.
                const checkboxRegex = /^(\s*(?:[-*+]|\d+\.)\s+\[(.)\])/;
                const match = originalLine.match(checkboxRegex);

                if (match) {
                    const fullMatch = match[1];
                    const charMatch = match[2];
                    const newChar = isChecked ? "x" : " ";
                    const newLine = originalLine.replace(fullMatch, fullMatch.replace(`[${charMatch}]`, `[${newChar}]`));
                    lines[lineIndex] = newLine;
                }
            }
            return lines.join("\n");
        });
    }

    escapeHtml(str: string): string {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }
}
