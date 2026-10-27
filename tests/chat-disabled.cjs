'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const RoleSystem = require('../js/role-system-v2.js');
const RoleMenu = require('../js/role-menu-v2.js');

for (const role of RoleSystem.ROLE_IDS) {
  if (role === 'WALI_SANTRI') continue;
  const session = RoleSystem.resolveSession({
    roleSystemVersion: 2,
    roles: [role],
    defaultRole: role,
    assignments: { [role]: {} }
  });
  assert(!RoleMenu.model(session).some(item => item.id === 'menu-chat'), `${role} must not expose chat`);
}

for (const file of ['main-dashboard.html', 'docs/main-dashboard.html']) {
  const source = fs.readFileSync(file, 'utf8');
  assert(!source.includes('id="featureChatFab"'), `${file} has no chat FAB`);
  assert(!source.includes('id="pengurusChatWindow"'), `${file} has no chat window`);
  assert(!source.includes('js/chat-uid-v2.js'), `${file} does not load chat client`);
  assert(!source.includes('js/pengurus-whatsapp-chat.js'), `${file} does not load chat engine`);
}

for (const file of ['wali/dashboard/index.html', 'docs/wali/dashboard/index.html']) {
  const source = fs.readFileSync(file, 'utf8');
  assert(!source.includes('id="waliChatWindow"'), `${file} has no Wali chat window`);
  assert(!source.includes('aria-label="Buka Pesan"'), `${file} has no Wali chat icon`);
  assert(!source.includes('../../js/chat-uid-v2.js'), `${file} does not load chat client`);
}

for (const file of ['pesan.html','docs/pesan.html','js/chat-uid-v2.js','docs/js/chat-uid-v2.js','js/pengurus-whatsapp-chat.js','docs/js/pengurus-whatsapp-chat.js']) {
  assert(!fs.existsSync(file), `${file} removed`);
}

console.log('PASS chat feature, routes, clients, windows, and icons removed');
