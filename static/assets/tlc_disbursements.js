const $ = id => document.getElementById(id);

let allTransactions = [];
let displayedTransactions = [];

function money(v){
    return "KSh " + Number(v || 0).toLocaleString("en-KE",{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });
}

function esc(v){
    return String(v ?? "")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function today(){
    const d = new Date();
    return d.toISOString().slice(0,10);
}

function setDefaults(){
    const d = new Date();
    $("transaction_date").value = d.toISOString().slice(0,10);
    $("transaction_time").value = d.toTimeString().slice(0,5);
}

function dateAllowed(transaction){
    const filter = $("dateFilter").value;
    if(!filter) return true;

    const raw = String(transaction.date || "");
    if(!raw) return false;

    const t = new Date(raw + "T00:00:00");
    const now = new Date();

    if(filter === "today"){
        return raw === today();
    }

    if(filter === "year"){
        return t.getFullYear() === now.getFullYear();
    }

    const days = Number(filter);
    const start = new Date();
    start.setHours(0,0,0,0);
    start.setDate(start.getDate() - (days - 1));

    return t >= start;
}

function applyFilters(){

    const q = $("search").value.trim().toLowerCase();
    const category = $("categoryFilter").value.toLowerCase();
    const method = $("methodFilter").value.toLowerCase();

    displayedTransactions = allTransactions.filter(t => {

        if(category &&
            String(t.category || "").toLowerCase() !== category){
            return false;
        }

        if(method &&
            String(t.payment_method || "").toLowerCase() !== method){
            return false;
        }

        if(!dateAllowed(t)){
            return false;
        }

        if(q){
            const blob = [
                t.date,
                t.time,
                t.disbursement_id,
                t.category,
                t.purpose,
                t.paid_to,
                t.payment_method,
                t.reference,
                t.amount,
                t.status
            ].join(" ").toLowerCase();

            if(!blob.includes(q)) return false;
        }

        return true;
    });

    displayedTransactions.sort((a,b) => {
        return String(b.date || "").localeCompare(String(a.date || ""))
            || String(b.time || "").localeCompare(String(a.time || ""));
    });

    render();
}

function render(){

    const rows = $("rows");
    rows.innerHTML = "";

    if(!displayedTransactions.length){
        rows.innerHTML = `
        <tr>
            <td colspan="10" class="empty">
                No Money Out records match the current filter.
            </td>
        </tr>`;
    }else{

        for(const t of displayedTransactions){

            const status =
                String(t.status || "RECORDED").toUpperCase();

            rows.innerHTML += `
            <tr>
                <td>${esc(t.date)}</td>
                <td>${esc(t.time)}</td>
                <td>${esc(t.disbursement_id)}</td>
                <td>${esc(t.category)}</td>
                <td>${esc(t.purpose)}</td>
                <td>${esc(t.paid_to)}</td>
                <td>${esc(t.payment_method)}</td>
                <td>${esc(t.reference)}</td>
                <td class="amount">${money(t.amount)}</td>
                <td><span class="status ok">${esc(status)}</span></td>
            </tr>`;
        }
    }

    const total = displayedTransactions.reduce(
        (s,t) => s + Number(t.amount || 0),0
    );

    const largest = displayedTransactions.length
        ? Math.max(...displayedTransactions.map(t => Number(t.amount || 0)))
        : 0;

    const average = displayedTransactions.length
        ? total / displayedTransactions.length
        : 0;

    $("total").textContent = money(
        allTransactions.reduce((s,t)=>s+Number(t.amount||0),0)
    );

    $("count").textContent =
        allTransactions.length.toLocaleString("en-KE");

    $("average").textContent = money(average);
    $("largest").textContent = money(largest);

    $("displayed").textContent =
        displayedTransactions.length.toLocaleString("en-KE");

    $("displayedTotal").textContent = money(total);

    const filters = [];

    if($("categoryFilter").value)
        filters.push($("categoryFilter").value);

    if($("methodFilter").value)
        filters.push($("methodFilter").value);

    if($("dateFilter").value)
        filters.push($("dateFilter").selectedOptions[0].text);

    if($("search").value.trim())
        filters.push("Search");

    $("currentFilter").textContent =
        filters.length ? filters.join(" • ") : "All";

    $("ledgerCaption").textContent =
        displayedTransactions.length +
        " record(s) displayed from " +
        allTransactions.length +
        " total record(s)";
}

async function load(){

    try{

        const response = await fetch(
            "/api/tlc/disbursements",
            {credentials:"same-origin"}
        );

        const data = await response.json();

        if(!response.ok || data.success === false){
            throw new Error(
                data.message || "Unable to load Money Out records."
            );
        }

        const register = data.register || data;

        allTransactions = Array.isArray(register.transactions)
            ? register.transactions
            : [];

        applyFilters();

    }catch(error){

        $("rows").innerHTML = `
        <tr>
            <td colspan="10" class="empty">
                ${esc(error.message)}
            </td>
        </tr>`;
    }
}

function downloadCsv(){

    const header = [
        "Date",
        "Time",
        "Disbursement ID",
        "Category",
        "Purpose",
        "Paid To",
        "Payment Method",
        "Reference",
        "Amount",
        "Status"
    ];

    const lines = [
        header
            .map(v => `"${v.replaceAll('"','""')}"`)
            .join(",")
    ];

    displayedTransactions.forEach(t => {

        const row = [
            t.date,
            t.time,
            t.disbursement_id,
            t.category,
            t.purpose,
            t.paid_to,
            t.payment_method,
            t.reference,
            Number(t.amount || 0).toFixed(2),
            t.status
        ];

        lines.push(
            row.map(v =>
                `"${String(v ?? "").replaceAll('"','""')}"`
            ).join(",")
        );
    });

    const blob = new Blob(
        [lines.join("\r\n")],
        {type:"text/csv;charset=utf-8"}
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;

    const stamp = new Date()
        .toISOString()
        .slice(0,10);

    a.download = `TLC_Money_Out_Report_${stamp}.csv`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

function printReport(){

    const total = displayedTransactions.reduce(
        (s,t)=>s+Number(t.amount||0),0
    );

    const rows = displayedTransactions.map(t => `
        <tr>
            <td>${esc(t.date)}</td>
            <td>${esc(t.disbursement_id)}</td>
            <td>${esc(t.category)}</td>
            <td>${esc(t.purpose)}</td>
            <td>${esc(t.paid_to)}</td>
            <td>${esc(t.payment_method)}</td>
            <td style="text-align:right">KSh ${Number(t.amount||0).toLocaleString("en-KE",{minimumFractionDigits:2})}</td>
        </tr>
    `).join("");

    const win = window.open("","_blank");

    win.document.write(`
    <!doctype html>
    <html>
    <head>
    <title>TLC Money Out Report</title>
    <style>
    body{font-family:Arial,sans-serif;color:#111;padding:35px}
    h1{margin:0;color:#10243c}
    p{color:#555}
    .summary{display:flex;gap:30px;margin:22px 0}
    .box{border:1px solid #ddd;padding:15px;border-radius:8px}
    .box b{display:block;font-size:20px}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    th,td{padding:9px;border:1px solid #ddd;font-size:11px;text-align:left}
    th{background:#10243c;color:white}
    .footer{margin-top:35px;font-size:10px;color:#777}
    </style>
    </head>
    <body>
    <h1>THE LEGACY CIRCLE</h1>
    <h2>Official Money Out Report</h2>
    <p>Generated ${new Date().toLocaleString("en-KE")}</p>

    <div class="summary">
        <div class="box">
            <span>Transactions</span>
            <b>${displayedTransactions.length}</b>
        </div>
        <div class="box">
            <span>Total Money Out</span>
            <b>KSh ${total.toLocaleString("en-KE",{minimumFractionDigits:2})}</b>
        </div>
    </div>

    <table>
    <thead>
    <tr>
    <th>Date</th>
    <th>ID</th>
    <th>Category</th>
    <th>Purpose</th>
    <th>Paid To</th>
    <th>Method</th>
    <th>Amount</th>
    </tr>
    </thead>
    <tbody>${rows}</tbody>
    </table>

    <div class="footer">
    Powered by Thee Alvin Tech Solutions · The Legacy Circle
    </div>
    </body>
    </html>
    `);

    win.document.close();
    win.focus();

    setTimeout(()=>win.print(),400);
}

async function shareReport(){

    const total = displayedTransactions.reduce(
        (s,t)=>s+Number(t.amount||0),0
    );

    const text =
`THE LEGACY CIRCLE
MONEY OUT REPORT

Records: ${displayedTransactions.length}
Total Money Out: ${money(total)}
Generated: ${new Date().toLocaleString("en-KE")}`;

    try{

        if(navigator.share){
            await navigator.share({
                title:"TLC Money Out Report",
                text
            });
        }else{

            await navigator.clipboard.writeText(text);

            $("status").textContent =
                "Report summary copied to clipboard.";

            $("status").style.color = "#55dfa0";
        }

    }catch(error){}
}

$("search").addEventListener("input",applyFilters);
$("categoryFilter").addEventListener("change",applyFilters);
$("methodFilter").addEventListener("change",applyFilters);
$("dateFilter").addEventListener("change",applyFilters);

$("refresh").addEventListener("click",load);
$("downloadCsv").addEventListener("click",downloadCsv);
$("printReport").addEventListener("click",printReport);
$("shareReport").addEventListener("click",shareReport);

$("f").addEventListener("submit",async e=>{

    e.preventDefault();

    $("save").disabled = true;
    $("status").textContent = "Recording...";
    $("status").style.color = "#79dfff";

    const payload = {
        amount:$("amount").value,
        category:$("category").value,
        purpose:$("purpose").value.trim(),
        paid_to:$("paid_to").value.trim(),
        payment_method:$("payment_method").value,
        reference:$("reference").value.trim(),
        authorized_by:$("authorized_by").value.trim(),
        recorded_by:$("recorded_by").value.trim(),
        notes:$("notes").value.trim(),
        transaction_date:$("transaction_date").value,
        transaction_time:$("transaction_time").value
    };

    try{

        const response = await fetch(
            "/api/tlc/disbursements",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                credentials:"same-origin",
                body:JSON.stringify(payload)
            }
        );

        const data = await response.json();

        if(!response.ok || data.success === false){
            throw new Error(
                data.message || "Unable to record disbursement."
            );
        }

        $("status").textContent =
            "Money Out recorded successfully.";

        $("status").style.color = "#55dfa0";

        $("f").reset();
        setDefaults();

        await load();

    }catch(error){

        $("status").textContent = error.message;
        $("status").style.color = "#ff6d79";

    }finally{

        $("save").disabled = false;
    }
});

setDefaults();
load();
