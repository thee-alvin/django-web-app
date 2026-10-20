document.addEventListener("DOMContentLoaded", () => {
    const title = [...document.querySelectorAll("h1")].find(
        el => el.textContent.trim() === "TLC Constitution"
    );

    if (!title) return;

    const existing = document.querySelector(".constitution-actions");
    if (existing) existing.remove();

    const header = title.parentElement;

    const actions = document.createElement("div");
    actions.className = "constitution-actions";

    actions.innerHTML = `
        <a href="/api/member/constitution/download"
           class="constitution-action download-action">
            <span class="action-icon">↓</span>
            <span>Download Official Copy</span>
        </a>

        <button type="button"
                class="constitution-action print-action">
            <span class="action-icon">⎙</span>
            <span>Print Official Copy</span>
        </button>
    `;

    header.insertAdjacentElement("afterend", actions);

    actions.querySelector(".print-action").addEventListener("click", () => {
        window.open(
            "/api/member/constitution/print",
            "_blank",
            "noopener,noreferrer"
        );
    });

    const style = document.createElement("style");
    style.textContent = `
        .constitution-actions {
            width: 100%;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 12px;
            margin: 18px 0 26px;
            box-sizing: border-box;
        }

        .constitution-action {
            height: 44px;
            padding: 0 18px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            border-radius: 8px;
            font-family: inherit;
            font-size: 13px;
            font-weight: 700;
            text-decoration: none !important;
            cursor: pointer;
            box-sizing: border-box;
            transition: all .2s ease;
        }

        .action-icon {
            font-size: 18px;
            line-height: 1;
            font-weight: 800;
        }

        .download-action {
            background: #0b1f3a;
            color: #fff !important;
            border: 1px solid #0b1f3a;
            box-shadow: 0 3px 8px rgba(11,31,58,.16);
        }

        .print-action {
            background: #c9a227;
            color: #111;
            border: 1px solid #c9a227;
            box-shadow: 0 3px 8px rgba(201,162,39,.18);
        }

        .download-action:hover,
        .print-action:hover {
            transform: translateY(-1px);
        }

        @media (max-width: 700px) {
            .constitution-actions {
                flex-direction: column;
            }

            .constitution-action {
                width: 100%;
            }
        }

        @media print {
            .constitution-actions {
                display: none !important;
            }
        }
    `;

    document.head.appendChild(style);
});
