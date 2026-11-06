// Shared client-side interactions for the four demonstration pages.
document.addEventListener("DOMContentLoaded", () => {
    setupMobileNavigation();
    setupCurrentYear();
    setupLoginForm();
    setupEmployeeForm();
    setupEmployeeSearch();
    setupReportFilters();
    setupContactForm();
});

function setupMobileNavigation() {
    const toggle = document.querySelector(".nav-toggle");
    const navigation = document.querySelector(".main-nav");

    if (!toggle || !navigation) return;

    toggle.addEventListener("click", () => {
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!isOpen));
        toggle.setAttribute("aria-label", isOpen ? "فتح القائمة" : "إغلاق القائمة");
        navigation.classList.toggle("is-open", !isOpen);
    });

    navigation.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "فتح القائمة");
            navigation.classList.remove("is-open");
        }
    });
}

function setupCurrentYear() {
    document.querySelectorAll("[data-current-year]").forEach((element) => {
        element.textContent = toArabicDigits(new Date().getFullYear());
    });
}

function showMessage(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `form-message ${type}`;
}

function clearInvalidState(form) {
    form.querySelectorAll("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
}

function validateForm(form, messageElement) {
    clearInvalidState(form);
    if (form.checkValidity()) return true;

    const invalidField = form.querySelector(":invalid");
    if (invalidField) {
        invalidField.setAttribute("aria-invalid", "true");
        invalidField.focus();
    }
    showMessage(messageElement, "يرجى مراجعة الحقول المطلوبة والتأكد من صحة البيانات.", "error");
    return false;
}

function setupLoginForm() {
    const form = document.querySelector("#login-form");
    if (!form) return;

    const message = document.querySelector("#login-message");
    const password = form.querySelector("#password");
    const passwordToggle = form.querySelector(".password-toggle");

    passwordToggle?.addEventListener("click", () => {
        const reveal = password.type === "password";
        password.type = reveal ? "text" : "password";
        passwordToggle.setAttribute("aria-pressed", String(reveal));
        passwordToggle.setAttribute("aria-label", reveal ? "إخفاء كلمة المرور" : "إظهار كلمة المرور");
        passwordToggle.innerHTML = `<i class="fa-regular ${reveal ? "fa-eye-slash" : "fa-eye"}" aria-hidden="true"></i>`;
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!validateForm(form, message)) return;
        showMessage(message, "تم التحقق من الحقول. تسجيل الدخول غير متصل بحسابات فعلية في هذه النسخة التجريبية.", "info");
    });

    form.addEventListener("reset", () => {
        window.setTimeout(() => {
            clearInvalidState(form);
            message.textContent = "";
            message.className = "form-message";
            if (password.type !== "password") {
                password.type = "password";
                passwordToggle?.setAttribute("aria-pressed", "false");
                passwordToggle?.setAttribute("aria-label", "إظهار كلمة المرور");
                if (passwordToggle) passwordToggle.innerHTML = '<i class="fa-regular fa-eye" aria-hidden="true"></i>';
            }
        }, 0);
    });
}

function toArabicDigits(value) {
    return String(value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
}

function setupEmployeeForm() {
    const form = document.querySelector("#employee-form");
    if (!form) return;

    const tableBody = document.querySelector("#employee-table-body");
    const message = document.querySelector("#employee-message");
    const count = document.querySelector("#employee-count");

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!validateForm(form, message)) return;

        const name = form.elements.employee_name.value.trim();
        const department = form.elements.department.value;
        const employeeId = form.elements.employee_id.value.trim();
        const duplicate = [...tableBody.querySelectorAll("[data-employee-id]")].some(
            (row) => row.dataset.employeeId.toLowerCase() === employeeId.toLowerCase()
        );

        if (duplicate) {
            form.elements.employee_id.setAttribute("aria-invalid", "true");
            form.elements.employee_id.focus();
            showMessage(message, "هذا الرقم الوظيفي مسجل بالفعل. يرجى إدخال رقم آخر.", "error");
            return;
        }

        const row = document.createElement("tr");
        row.dataset.employeeId = employeeId;

        const numberCell = document.createElement("td");
        numberCell.className = "employee-number";
        numberCell.textContent = toArabicDigits(tableBody.querySelectorAll("tr").length + 1);

        const nameCell = document.createElement("td");
        const person = document.createElement("span");
        person.className = "table-person";
        const avatar = document.createElement("span");
        avatar.className = "avatar avatar-blue";
        avatar.textContent = name.trim().charAt(0);
        const fullName = document.createElement("strong");
        fullName.textContent = name;
        person.append(avatar, fullName);
        nameCell.append(person);

        const departmentCell = document.createElement("td");
        departmentCell.textContent = department;

        const statusCell = document.createElement("td");
        const status = document.createElement("span");
        status.className = "status-pill status-active";
        const statusDot = document.createElement("span");
        status.append(statusDot, document.createTextNode(" نشط"));
        statusCell.append(status);

        const actionCell = document.createElement("td");
        actionCell.className = "actions-cell";
        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-row-button";
        deleteButton.type = "button";
        deleteButton.setAttribute("aria-label", `حذف الموظف ${name}`);
        deleteButton.innerHTML = '<i class="fa-regular fa-trash-can" aria-hidden="true"></i>';
        actionCell.append(deleteButton);

        row.append(numberCell, nameCell, departmentCell, statusCell, actionCell);
        tableBody.append(row);
        updateEmployeeCount(tableBody, count);
        document.querySelector("#employee-search").value = "";
        tableBody.querySelectorAll("tr").forEach((employeeRow) => {
            employeeRow.hidden = false;
        });
        form.reset();
        showMessage(message, `تمت إضافة ${name} إلى القائمة. هذا التغيير مؤقت في هذه الصفحة فقط.`, "success");
    });

    tableBody.addEventListener("click", (event) => {
        const deleteButton = event.target.closest(".delete-row-button");
        if (!deleteButton) return;
        const row = deleteButton.closest("tr");
        const name = row.querySelector(".table-person strong")?.textContent || "الموظف";
        row.remove();
        updateEmployeeCount(tableBody, count);
        showMessage(message, `تم حذف ${name} من العرض التجريبي.`, "success");
    });
}

function updateEmployeeCount(tableBody, countElement) {
    if (!countElement) return;
    countElement.textContent = toArabicDigits(tableBody.querySelectorAll("tr:not(.empty-row)").length);
}

function setupEmployeeSearch() {
    const search = document.querySelector("#employee-search");
    const tableBody = document.querySelector("#employee-table-body");
    if (!search || !tableBody) return;

    search.addEventListener("input", () => {
        const query = search.value.trim().toLocaleLowerCase("ar");
        tableBody.querySelectorAll("tr:not(.empty-row)").forEach((row) => {
            row.hidden = !row.textContent.toLocaleLowerCase("ar").includes(query);
        });
    });
}

function setupReportFilters() {
    const form = document.querySelector("#report-form");
    if (!form) return;

    const message = document.querySelector("#report-message");
    const startDate = form.elements.start_date;
    const endDate = form.elements.end_date;
    const employee = form.elements.employee;
    const rows = [...document.querySelectorAll("#report-table-body tr[data-month]")];
    const emptyRow = document.querySelector("#report-empty");
    const period = document.querySelector("#report-period");

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!validateForm(form, message)) return;

        if (startDate.value > endDate.value) {
            endDate.setAttribute("aria-invalid", "true");
            endDate.focus();
            showMessage(message, "يجب أن يكون تاريخ البداية قبل تاريخ النهاية أو مساويًا له.", "error");
            return;
        }

        const startMonth = startDate.value.slice(0, 7);
        const endMonth = endDate.value.slice(0, 7);
        let visibleCount = 0;
        rows.forEach((row) => {
            const month = row.dataset.month;
            const monthIsInRange = month >= startMonth && month <= endMonth;
            const employeeMatches = employee.value === "all" || row.dataset.employee === employee.value;
            row.hidden = !monthIsInRange || !employeeMatches;
            if (!row.hidden) visibleCount += 1;
        });
        if (emptyRow) emptyRow.hidden = visibleCount > 0;

        const dateFormat = new Intl.DateTimeFormat("ar", { month: "long", year: "numeric" });
        const firstMonth = dateFormat.format(new Date(`${startMonth}-15T12:00:00`));
        const lastMonth = dateFormat.format(new Date(`${endMonth}-15T12:00:00`));
        if (period) {
            period.innerHTML = '<i class="fa-regular fa-calendar" aria-hidden="true"></i> ';
            period.append(document.createTextNode(firstMonth === lastMonth ? firstMonth : `${firstMonth} – ${lastMonth}`));
        }
        showMessage(message, `تم عرض ${toArabicDigits(visibleCount)} نتيجة من البيانات التوضيحية.`, "success");
    });
}

function setupContactForm() {
    const form = document.querySelector("#contact-form");
    if (!form) return;

    const message = document.querySelector("#contact-message-status");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!validateForm(form, message)) return;

        const email = form.elements.email;
        if (!email.validity.valid) {
            email.setAttribute("aria-invalid", "true");
            email.focus();
            showMessage(message, "يرجى إدخال بريد إلكتروني صحيح.", "error");
            return;
        }

        const name = form.elements.name.value.trim();
        form.reset();
        showMessage(message, `شكرًا ${name}، تم استلام رسالتك في هذا العرض التجريبي. لم تُرسل إلى خادم.`, "success");
    });
}
