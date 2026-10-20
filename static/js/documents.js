async function loadDocuments() {
    const grid = document.getElementById("documentsGrid");

    try {
        const response = await fetch("/api/member/documents");
        const data = await response.json();

        if (!data.success) {
            throw new Error();
        }

        const documents = data.documents || [];

        if (!documents.length) {
            grid.innerHTML = `
                <div class="documents-empty">
                    <h3>No documents found</h3>
                    <p>There are currently no active official documents.</p>
                </div>
            `;
            return;
        }

        const doc = documents[0];

        grid.innerHTML = `
            <article class="document-card">

                <div class="document-icon">▤</div>

                <div class="document-info">
                    <span class="document-category">
                        ${escapeHtml(doc.category || "Official Document")}
                    </span>

                    <h3>${escapeHtml(doc.document_name)}</h3>

                    <p>
                        ${escapeHtml(
                            doc.description || "Official TLC document."
                        )}
                    </p>

                    <div class="document-meta">
                        <span>${escapeHtml(doc.document_id)}</span>
                        <span>${escapeHtml(String(doc.date_added || ""))}</span>
                    </div>
                </div>

                <div class="document-actions">

                    <a
                        href="/api/member/documents/files/TLC_Constitution.pdf"
                        target="_blank"
                        rel="noopener"
                        class="document-view-btn">
                        View
                    </a>

                    <a
                        href="/api/member/documents/files/TLC_Constitution.pdf"
                        download="THE_LEGACY_CIRCLE_OFFICIAL_CONSTITUTION.pdf"
                        class="document-download-btn">
                        Download
                    </a>

                </div>

            </article>
        `;

    } catch (error) {
        console.error(error);

        grid.innerHTML = `
            <div class="documents-empty">
                <h3>Documents unavailable</h3>
                <p>Unable to load official documents.</p>
            </div>
        `;
    }
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

loadDocuments();
