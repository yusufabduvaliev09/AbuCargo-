/* app.js — логика фронта (регистрация, вход, профиль) */
(async function(){
  // helpers
  function el(id){ return document.getElementById(id); }
  function genCode(){ return 'YX' + Math.floor(1 + Math.random()*1000); }
  async function sha256(str){
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  // UI helpers
  window.showLogin = ()=>{ el('registerCard').classList.add('hidden'); el('loginCard').classList.remove('hidden'); }
  window.showRegister = ()=>{ el('loginCard').classList.add('hidden'); el('registerCard').classList.remove('hidden'); }
  window.goHome = ()=>{ window.location.href = 'index.html'; }

  // register
  el('btnRegister').addEventListener('click', async ()=>{
    const fullname = el('reg_fullname').value.trim();
    const phone = el('reg_phone').value.trim();
    const pass = el('reg_password').value;
    const pvz = el('reg_pvz').value;
    if(!fullname||!phone||!pass){ alert('Заполните все поля'); return; }
    const uid = phone.replace(/\D/g,'');
    const snapshot = await db.ref('users/' + uid).get();
    if(snapshot.exists()){ alert('Пользователь с этим телефоном уже есть'); return; }
    const code = genCode();
    const passHash = await sha256(pass);
    const userObj = { fullname, phone, passwordHash: passHash, pvz, code, createdAt: new Date().toISOString(), role: 'user', products: {} };
    await db.ref('users/' + uid).set(userObj);
    localStorage.setItem('abu_user', uid);
    alert('Успешно! Ваш код: ' + code);
    window.location.href = 'dashboard.html';
  });

  // login
  el('btnLogin').addEventListener('click', async ()=>{
    const phone = el('login_phone').value.trim();
    const pass = el('login_password').value;
    if(!phone||!pass){ alert('Заполните поля'); return; }
    const uid = phone.replace(/\D/g,'');
    const snap = await db.ref('users/' + uid).get();
    if(!snap.exists()){ alert('Пользователь не найден'); return; }
    const data = snap.val();
    const passHash = await sha256(pass);
    if(passHash !== data.passwordHash){ alert('Неверный пароль'); return; }
    localStorage.setItem('abu_user', uid);
    // если админ — редирект в admin.html
    if(data.role === 'admin') window.location.href = 'admin.html';
    else window.location.href = 'dashboard.html';
  });

  // auto-login on index (if already logged)
  const who = localStorage.getItem('abu_user');
  if(who){
    // если на index и уже логин — перенаправить на dashboard/admin
    const snap = await db.ref('users/' + who).get();
    if(snap.exists()){
      const u = snap.val();
      if(u.role === 'admin') window.location.href = 'admin.html';
      else window.location.href = 'dashboard.html';
    } else {
      localStorage.removeItem('abu_user');
    }
  }

  // ================== dashboard logic ==================
  // if we are on dashboard.html, load profile and products
  if(window.location.pathname.endsWith('dashboard.html')){
    const uid = localStorage.getItem('abu_user');
    if(!uid){ window.location.href = 'index.html'; return; }
    const snap = await db.ref('users/' + uid).get();
    if(!snap.exists()){ alert('Пользователь не найден'); localStorage.removeItem('abu_user'); window.location.href='index.html'; return; }
    const user = snap.val();
    el('userCode').innerText = user.code || '';
    el('userPvz').innerText = user.pvz || '';
    el('profile_fullname').value = user.fullname || '';
    el('profile_phone').value = user.phone || '';
    el('profile_pvz').value = user.pvz || '';

    // render products
    function renderProducts(){
      const tbody = el('productsTbody'); tbody.innerHTML = '';
      const products = user.products || {};
      Object.keys(products).forEach(pid=>{
        const p = products[pid];
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.track||pid}</td><td>${p.name}</td><td>${p.status}</td>`;
        tbody.appendChild(tr);
      });
    }
    renderProducts();

    // save profile
    el('btnSaveProfile').addEventListener('click', async ()=>{
      const fn = el('profile_fullname').value.trim();
      const ph = el('profile_phone').value.trim();
      const pvz = el('profile_pvz').value;
      if(!fn||!ph){ alert('ФИО и телефон обязательны'); return; }
      // check phone conflict
      const other = await db.ref('users').orderByChild('phone').equalTo(ph).get();
      if(other.exists()){
        // if record exists but it's same uid — ok
        if(!other.hasChild(uid) && Object.keys(other.val()).some(k=>k !== uid)){ alert('Этот телефон уже занят'); return; }
      }
      user.fullname = fn; user.phone = ph; user.pvz = pvz;
      await db.ref('users/' + uid).update({ fullname: fn, phone: ph, pvz });
      alert('Данные обновлены');
    });

    // change password
    el('btnChangePass').addEventListener('click', async ()=>{
      const p1 = el('profile_newpass').value;
      const p2 = el('profile_newpass2').value;
      if(!p1||!p2){ alert('Оба поля обязательны'); return; }
      if(p1 !== p2) { alert('Пароли не совпадают'); return; }
      const newHash = await sha256(p1);
      await db.ref('users/' + uid + '/passwordHash').set(newHash);
      el('profile_newpass').value = ''; el('profile_newpass2').value = '';
      alert('Пароль изменён');
    });

    // logout
    window.logout = ()=>{
      localStorage.removeItem('abu_user'); window.location.href = 'index.html';
    };
  }

  // ================== admin helpers (basic) ==================
  // admin.js will use some functions from here; to keep separation we also expose a few global helpers
  window._appHelpers = {
    db, sha256, genCode
  };

  // ================== generic logout for index/admin pages ==================
  if(!window.logout) window.logout = ()=>{ localStorage.removeItem('abu_user'); window.location.href='index.html'; };

})();
