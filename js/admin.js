/* admin.js — админская логика */
(async function(){
  const { db, genCode } = window._appHelpers || {};
  function el(id){ return document.getElementById(id); }

  // check admin auth
  const uid = localStorage.getItem('abu_user');
  if(!uid){ window.location.href='index.html'; return; }
  const snap = await db.ref('users/' + uid).get();
  if(!snap.exists()) { localStorage.removeItem('abu_user'); window.location.href='index.html'; return; }
  const me = snap.val();
  if(me.role !== 'admin'){ alert('Доступ запрещён: вы не админ'); window.location.href='index.html'; return; }

  // render users
  window.renderAdminUsers = async function(){
    const q = (el('adminSearch')?.value || '').trim().toLowerCase();
    const tb = el('adminUsersTbody'); tb.innerHTML = '';
    const all = await db.ref('users').get();
    if(!all.exists()) return;
    const data = all.val();
    Object.keys(data).forEach(uid=>{
      const u = data[uid];
      if(u.role === 'admin') return; // skip admin row
      const matches = !q || (u.fullname||'').toLowerCase().includes(q) || (u.phone||'').toLowerCase().includes(q) || (u.code||'').toLowerCase().includes(q);
      if(!matches) return;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u.fullname||''}</td><td>${u.phone||''}</td><td>${u.pvz||''}</td><td><span class="code">${u.code||''}</span></td>
        <td><button class="btn ghost" onclick="adminEditUser('${uid}')">Редактировать</button></td>`;
      tb.appendChild(tr);
    });
  };

  // render orders (products)
  window.renderAdminOrders = async function(){
    const tb = el('adminOrdersTbody'); tb.innerHTML = '';
    const all = await db.ref('users').get();
    if(!all.exists()) return;
    const data = all.val();
    Object.keys(data).forEach(uid=>{
      const u = data[uid];
      if(!u.products) return;
      Object.keys(u.products).forEach(pid=>{
        const p = u.products[pid];
        const tr = document.createElement('tr');
        const date = p.createdAt ? new Date(p.createdAt).toLocaleString() : '';
        tr.innerHTML = `<td>${u.code||''}</td>
          <td>${u.fullname||''} <div class="muted small">${u.phone||''}</div></td>
          <td>${p.name||''}</td><td>${p.track||pid}</td>
          <td>
            <select onchange="adminChangeStatus('${uid}','${pid}',this.value)">
              <option ${p.status==='В пути'?'selected':''}>В пути</option>
              <option ${p.status==='На складе'?'selected':''}>На складе</option>
              <option ${p.status==='Получен'?'selected':''}>Получен</option>
            </select>
          </td>
          <td>${date}</td>
          <td><button class="btn ghost" onclick="adminDeleteOrder('${uid}','${pid}')">Удалить</button></td>`;
        tb.appendChild(tr);
      });
    });
  };

  // expose edit flow
  window.adminEditUser = async function(targetUid){
    const uSnap = await db.ref('users/' + targetUid).get();
    if(!uSnap.exists()) return alert('Пользователь не найден');
    const u = uSnap.val();
    el('adminEditCard').style.display = 'block';
    el('admin_edit_fullname').value = u.fullname || '';
    el('admin_edit_phone').value = u.phone || '';
    el('admin_edit_pvz').value = u.pvz || 'Нариман';
    // store editing id
    el('adminSaveBtn').dataset.editing = targetUid;
  };

  el('adminCancelBtn')?.addEventListener('click', ()=>{ el('adminEditCard').style.display='none'; });
  el('adminSaveBtn')?.addEventListener('click', async ()=>{
    const target = el('adminSaveBtn').dataset.editing;
    if(!target) return;
    const fn = el('admin_edit_fullname').value.trim();
    const ph = el('admin_edit_phone').value.trim();
    const pvz = el('admin_edit_pvz').value;
    if(!fn||!ph) return alert('ФИО и телефон обязательны');
    await db.ref('users/' + target).update({ fullname: fn, phone: ph, pvz });
    alert('Обновлено');
    el('adminEditCard').style.display='none';
    renderAdminUsers(); renderAdminOrders();
  });

  el('adminDeleteBtn')?.addEventListener('click', async ()=>{
    const target = el('adminSaveBtn')?.dataset.editing;
    if(!target) return;
    if(!confirm('Удалить пользователя и все его заказы?')) return;
    await db.ref('users/' + target).remove();
    alert('Пользователь удалён');
    el('adminEditCard').style.display='none';
    renderAdminUsers(); renderAdminOrders();
  });

  // change product status
  window.adminChangeStatus = async function(userId, productId, status){
    await db.ref(`users/${userId}/products/${productId}/status`).set(status);
    renderAdminOrders();
  };

  window.adminDeleteOrder = async function(userId, productId){
    if(!confirm('Удалить заказ?')) return;
    await db.ref(`users/${userId}/products/${productId}`).remove();
    renderAdminOrders();
  };

  // initial render
  renderAdminUsers(); renderAdminOrders();

})();
