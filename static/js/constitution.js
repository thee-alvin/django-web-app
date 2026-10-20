let constitutionArticles = [];


async function loadConstitution() {

    const container =
        document.getElementById("constitutionContent");

    try {

        const response =
            await fetch("/api/member/constitution/text");

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        constitutionArticles =
            parseConstitution(data.text);

        renderConstitution(constitutionArticles);

        setupControls();

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="special-card">
                <h2 class="special-title">
                    Constitution unavailable
                </h2>

                <p class="article-text">
                    Unable to load the official TLC Constitution.
                </p>
            </div>
        `;
    }
}


/* ---------------------------------------------------------
   NORMALIZE PDF UNICODE TEXT
--------------------------------------------------------- */

function normalizeLine(line) {

    return line
        .replace(/𝐀/gu, "A")
        .replace(/𝐁/gu, "B")
        .replace(/𝐂/gu, "C")
        .replace(/𝐃/gu, "D")
        .replace(/𝐄/gu, "E")
        .replace(/𝐅/gu, "F")
        .replace(/𝐆/gu, "G")
        .replace(/𝐇/gu, "H")
        .replace(/𝐈/gu, "I")
        .replace(/𝐉/gu, "J")
        .replace(/𝐊/gu, "K")
        .replace(/𝐋/gu, "L")
        .replace(/𝐌/gu, "M")
        .replace(/𝐍/gu, "N")
        .replace(/𝐎/gu, "O")
        .replace(/𝐏/gu, "P")
        .replace(/𝐐/gu, "Q")
        .replace(/𝐑/gu, "R")
        .replace(/𝐒/gu, "S")
        .replace(/𝐓/gu, "T")
        .replace(/𝐔/gu, "U")
        .replace(/𝐕/gu, "V")
        .replace(/𝐖/gu, "W")
        .replace(/𝐗/gu, "X")
        .replace(/𝐘/gu, "Y")
        .replace(/𝐙/gu, "Z")

        .replace(/𝟎/gu, "0")
        .replace(/𝟏/gu, "1")
        .replace(/𝟐/gu, "2")
        .replace(/𝟑/gu, "3")
        .replace(/𝟒/gu, "4")
        .replace(/𝟓/gu, "5")
        .replace(/𝟔/gu, "6")
        .replace(/𝟕/gu, "7")
        .replace(/𝟖/gu, "8")
        .replace(/𝟗/gu, "9")

        .trim();
}


function isArticle(line) {
    return /^ARTICLE\s+\d+/i.test(line);
}


function isSection(line) {
    return /^Section\s+\d+/i.test(line);
}


/* ---------------------------------------------------------
   PARSE ARTICLES
--------------------------------------------------------- */

﻿/* ---------------------------------------------------------
   PARSE ARTICLES
--------------------------------------------------------- */

function parseConstitution(text) {

    const rawLines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);


    const lines = rawLines
        .map(normalizeLine)
        .filter(line => {

            /* Remove PDF page-number artifacts */
            if (
                /^\d+\s*\|\s*P\s*a\s*g\s*e/i.test(line)
            ) {
                return false;
            }

            /* Remove repeated PDF header */
            if (
                /TLC\s*CONSTITUTION/i.test(line)
            ) {
                return false;
            }

            return true;
        });


    const articles = [];

    let currentArticle = null;
    let currentSection = null;


    for (const line of lines) {

        /* ARTICLE */

        if (isArticle(line)) {

            currentArticle = {
                title: line,
                sections: []
            };

            articles.push(currentArticle);

            currentSection = null;

            continue;
        }


        /* Ignore anything before Article 1 */

        if (!currentArticle) {
            continue;
        }


        /*
         ------------------------------------------------------
         STOP THE NORMAL CONSTITUTION TEXT BEFORE THE
         SIGNATURE PAGES.

         These are rendered separately using the real
         signature images.
         ------------------------------------------------------
        */

        if (
            /^FOUNDING MEMBERS$/i.test(line) ||
            /^OFFICIAL SIGNATURE/i.test(line) ||
            /^FINAL DECLARATION$/i.test(line) ||
            /^END OF THE CONSTITUTION$/i.test(line)
        ) {
            break;
        }


        /* SECTION */

        if (isSection(line)) {

            currentSection = {
                title: line,
                lines: []
            };

            currentArticle.sections.push(
                currentSection
            );

            continue;
        }


        /* Create a section when necessary */

        if (!currentSection) {

            currentSection = {
                title: "",
                lines: []
            };

            currentArticle.sections.push(
                currentSection
            );
        }


        currentSection.lines.push(line);
    }


    return articles;
}



/* ---------------------------------------------------------
   RENDER ARTICLES
--------------------------------------------------------- */

function renderConstitution(articles) {

    const container =
        document.getElementById("constitutionContent");

    let html = "";


    articles.forEach((article, index) => {

        const numberMatch =
            article.title.match(/ARTICLE\s+(\d+)/i);

        const number =
            numberMatch
                ? numberMatch[1]
                : index + 1;


        const title =
            article.title
                .replace(
                    /^ARTICLE\s+\d+\s*/i,
                    ""
                )
                .replace(
                    /^[-–—]\s*/,
                    ""
                );


        html += `
            <article
                class="constitution-article"
                data-article="${number}"
            >

                <button
                    type="button"
                    class="article-header"
                    onclick="toggleArticle(this)"
                >

                    <div class="article-title-wrap">

                        <div class="article-number">
                            ${number}
                        </div>

                        <h2 class="article-title">
                            ARTICLE ${number}
                            ${
                                title
                                    ? " - " + escapeHtml(title)
                                    : ""
                            }
                        </h2>

                    </div>

                    <span class="article-arrow">
                        ▼
                    </span>

                </button>


                <div class="article-body">
        `;


        article.sections.forEach(section => {

            if (section.title) {

                html += `
                    <div class="article-section">

                        <h3 class="section-title">
                            ${escapeHtml(section.title)}
                        </h3>
                `;

            } else {

                html += `
                    <div class="article-section">
                `;
            }


            section.lines.forEach(line => {

                const isClause =
                    /^\([a-z]\)/i.test(line) ||
                    /^-\s*/.test(line);


                html += `
                    <p class="${
                        isClause
                            ? "article-clause"
                            : "article-text"
                    }">
                        ${escapeHtml(line)}
                    </p>
                `;
            });


            html += `
                    </div>
            `;
        });


        html += `
                </div>

            </article>
        `;
    });


    html += renderSignatureSection();


    container.innerHTML = html;
}


/* ---------------------------------------------------------
   FOUNDING MEMBERS + REAL SIGNATURES
--------------------------------------------------------- */

function renderSignatureSection() {

    return `

        <section class="signature-section">

            <div class="special-card">

                <div class="signature-heading">
                    <span class="signature-heading-line"></span>

                    <h2>
                        FOUNDING MEMBERS
                    </h2>

                    <span class="signature-heading-line"></span>
                </div>


                <div class="founding-table-wrap">

                    <table class="founding-table">

                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Full Name</th>
                                <th>Signature</th>
                                <th>Date</th>
                            </tr>
                        </thead>

                        <tbody>

                            <tr>
                                <td>1</td>
                                <td>Derrick Were</td>
                                <td>
                                    <img
                                        src="/static/assets/signatures/derrick_were_signature.png"
                                        class="member-signature"
                                        alt="Derrick Were signature"
                                    >
                                </td>
                                <td>1st September 2026</td>
                            </tr>


                            <tr>
                                <td>2</td>
                                <td>Owuor Alvin</td>
                                <td>
                                    <img
                                        src="/static/assets/signatures/owuor_alvin_signature.png"
                                        class="member-signature"
                                        alt="Owuor Alvin signature"
                                    >
                                </td>
                                <td>1st September 2026</td>
                            </tr>


                            <tr>
                                <td>3</td>
                                <td>Fedel Rimba</td>
                                <td>
                                    <img
                                        src="/static/assets/signatures/fedel_rimba_signature.png"
                                        class="member-signature"
                                        alt="Fedel Rimba signature"
                                    >
                                </td>
                                <td>1st September 2026</td>
                            </tr>


                            <tr>
                                <td>4</td>
                                <td>Elly Wandago</td>
                                <td>
                                    <img
                                        src="/static/assets/signatures/elly_wandago_signature.png"
                                        class="member-signature"
                                        alt="Elly Wandago signature"
                                    >
                                </td>
                                <td>1st September 2026</td>
                            </tr>


                            <tr>
                                <td>5</td>
                                <td>Sheela Onyango</td>
                                <td>
                                    <img
                                        src="/static/assets/signatures/sheela_onyango_signature.png"
                                        class="member-signature"
                                        alt="Sheela Onyango signature"
                                    >
                                </td>
                                <td>1st September 2026</td>
                            </tr>


                            <tr>
                                <td>6</td>
                                <td>Faith Tracy</td>
                                <td>
                                    <img
                                        src="/static/assets/signatures/faith_tracy_signature.png"
                                        class="member-signature"
                                        alt="Faith Tracy signature"
                                    >
                                </td>
                                <td>1st September 2026</td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>


            <div class="official-signatures-card">

                <div class="signature-heading">

                    <span class="signature-heading-line"></span>

                    <h2>
                        OFFICIAL SIGNATURES
                    </h2>

                    <span class="signature-heading-line"></span>

                </div>


                <div class="official-signatures-grid">


                    <div class="official-signature">

                        <div class="official-role">
                            OFFICIAL SIGNATURE OF THE CHAIRPERSON
                        </div>

                        <div class="official-name">
                            Sheela Onyango
                        </div>

                        <div class="official-signature-image">
                            <img
                                src="/static/assets/signatures/sheela_onyango_official_signature.png"
                                alt="Sheela Onyango official signature"
                            >
                        </div>

                        <div class="official-date">
                            2nd September 2026
                        </div>

                    </div>


                    <div class="official-signature">

                        <div class="official-role">
                            OFFICIAL SIGNATURE OF THE SECRETARY
                        </div>

                        <div class="official-name">
                            Faith Tracy
                        </div>

                        <div class="official-signature-image">
                            <img
                                src="/static/assets/signatures/faith_tracy_official_signature.png"
                                alt="Faith Tracy official signature"
                            >
                        </div>

                        <div class="official-date">
                            2nd September 2026
                        </div>

                    </div>


                    <div class="official-signature">

                        <div class="official-role">
                            OFFICIAL SIGNATURE OF THE TREASURER
                        </div>

                        <div class="official-name">
                            Owuor Alvin
                        </div>

                        <div class="official-signature-image">
                            <img
                                src="/static/assets/signatures/owuor_alvin_official_signature.png"
                                alt="Owuor Alvin official signature"
                            >
                        </div>

                        <div class="official-date">
                            2nd September 2026
                        </div>

                    </div>


                </div>

            </div>

        </section>
    `;
}


/* ---------------------------------------------------------
   ARTICLE TOGGLE
--------------------------------------------------------- */

function toggleArticle(button) {

    const article =
        button.closest(".constitution-article");

    article.classList.toggle("open");
}


/* ---------------------------------------------------------
   CONTROLS
--------------------------------------------------------- */

function setupControls() {

    const search =
        document.getElementById("constitutionSearch");

    const expand =
        document.getElementById("expandAllButton");

    const collapse =
        document.getElementById("collapseAllButton");


    search.addEventListener("input", () => {

        const query =
            search.value.trim().toLowerCase();


        document
            .querySelectorAll(".constitution-article")
            .forEach(article => {

                const matches =
                    article.innerText
                        .toLowerCase()
                        .includes(query);


                article.classList.toggle(
                    "search-hidden",
                    query.length > 0 && !matches
                );


                if (query && matches) {
                    article.classList.add("open");
                }

            });
    });


    expand.addEventListener("click", () => {

        document
            .querySelectorAll(".constitution-article")
            .forEach(article => {

                article.classList.add("open");

            });

    });


    collapse.addEventListener("click", () => {

        document
            .querySelectorAll(".constitution-article")
            .forEach(article => {

                article.classList.remove("open");

            });

    });
}


/* ---------------------------------------------------------
   HTML ESCAPING
--------------------------------------------------------- */

function escapeHtml(value) {

    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


document.addEventListener(
    "DOMContentLoaded",
    loadConstitution
);
