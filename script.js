const contactList = document.getElementById('contact-list');
const favoritesList = document.getElementById('favorites-list');
const addContactButton = document.getElementById('add-contact');
const contactNameInput = document.getElementById('contact-name');
const contactDetailsSection = document.getElementById('contact-details-section');
const importFileInput = document.getElementById('import-file');
const importExcelButton = document.getElementById('import-excel');
const exportExcelButton = document.getElementById('export-excel');

const API_BASE = "http://localhost:3000/api";

// 获取联系人数据
async function fetchContacts() {
    const response = await fetch(`${API_BASE}/contacts`);
    const contacts = await response.json();
    renderContacts(contacts);
}

// 渲染联系人列表
function renderContacts(contacts) {
    contactList.innerHTML = '';
    favoritesList.innerHTML = '';

    contacts.forEach(contact => {
        const li = document.createElement('li');
        li.textContent = `${contact.name} (${contact.details.length} 联系方式)`;

        // 收藏按钮
        const favoriteBtn = document.createElement('button');
        favoriteBtn.textContent = contact.is_favorite ? '取消收藏' : '收藏';
        favoriteBtn.onclick = () => toggleFavorite(contact.id, !contact.is_favorite);

        // 删除按钮
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '删除';
        removeBtn.onclick = () => deleteContact(contact.id);

        li.appendChild(favoriteBtn);
        li.appendChild(removeBtn);

        // 联系方式展示
        const detailsSection = document.createElement('div');
        contact.details.forEach(detail => {
            const detailText = document.createElement('p');
            detailText.textContent = `${detail.contact_type}: ${detail.contact_value}`;
            detailsSection.appendChild(detailText);
        });

        li.appendChild(detailsSection);

        // 根据收藏状态分别显示
        if (contact.is_favorite) {
            favoritesList.appendChild(li);
        } else {
            contactList.appendChild(li);
        }
    });
}


// 添加联系人
addContactButton.onclick = async () => {
    const name = contactNameInput.value.trim();
    if (!name) return alert('请输入联系人姓名');

    const details = [];
    document.querySelectorAll('.contact-type').forEach((input, index) => {
        const type = input.value.trim();
        const value = document.querySelectorAll('.contact-value')[index].value.trim();
        if (type && value) {
            details.push({ contact_type: type, contact_value: value });
        }
    });

    if (details.length === 0) return alert('请添加至少一个联系方式');

    const contact = { name, details };
    await fetch(`${API_BASE}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
    });
    contactNameInput.value = '';
    document.querySelectorAll('.contact-type').forEach(input => input.value = '');
    document.querySelectorAll('.contact-value').forEach(input => input.value = '');
    fetchContacts();
};

// 切换收藏状态
function toggleFavorite(contactId, isFavorite) {
    fetch(`/api/contacts/${contactId}/favorite`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_favorite: isFavorite })
    })
    .then(response => response.json())
    .then(data => {
        // 刷新联系人列表
        fetchContacts();
    })
    .catch(error => console.error('Error:', error));
}

// 刷新联系人列表
function fetchContacts() {
    fetch('/api/contacts')
    .then(response => response.json())
    .then(data => {
        renderContacts(data);
    })
    .catch(error => console.error('Error:', error));
}

// 删除联系人
async function deleteContact(id) {
    await fetch(`${API_BASE}/contacts/${id}`, { method: 'DELETE' });
    fetchContacts();
}

// 导出联系人到 Excel
exportExcelButton.onclick = () => {
    window.location.href = `${API_BASE}/export`;
};

// 导入联系人从 Excel
importExcelButton.onclick = async () => {
    const file = importFileInput.files[0];
    if (!file) return alert('请选择文件');
    const formData = new FormData();
    formData.append('file', file);
    await fetch(`${API_BASE}/import`, { method: 'POST', body: formData });
    fetchContacts();
};

// 添加联系方式字段
contactDetailsSection.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-contact-details')) {
        const contactTypeInput = e.target.previousElementSibling.previousElementSibling;
        const contactValueInput = e.target.previousElementSibling;

        if (!contactTypeInput.value.trim() || !contactValueInput.value.trim()) {
            return alert('请输入联系方式');
        }

        // 创建新的联系方式行
        const newRow = document.createElement('div');
        newRow.innerHTML = `
            <input type="text" class="contact-type" placeholder="联系方式类型">
            <input type="text" class="contact-value" placeholder="联系方式">
            <button class="add-contact-details">添加联系方式</button>
        `;
        contactDetailsSection.appendChild(newRow);
    }
});

// 初始化加载联系人
fetchContacts();
