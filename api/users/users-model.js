
const db = require('../../data/db-config.js');

// Tüm kullanıcıları rollerle birlikte getir
function bul() {
  return db('users as u')
    .join('roles as r', 'u.role_id', 'r.role_id')
    .select(
      'u.user_id',
      'u.username',
      'r.role_name'
    )
    .orderBy('u.user_id', 'asc');
}

// Filtreye uyan kullanıcıları getir
// Password alanı login için gereklidir
function goreBul(filtre) {
  return db('users as u')
    .join('roles as r', 'u.role_id', 'r.role_id')
    .select(
      'u.user_id',
      'u.username',
      'u.password',
      'r.role_name'
    )
    .where(filtre);
}

// ID'ye göre tek kullanıcı getir
function idyeGoreBul(user_id) {
  return db('users as u')
    .join('roles as r', 'u.role_id', 'r.role_id')
    .select(
      'u.user_id',
      'u.username',
      'r.role_name'
    )
    .where('u.user_id', user_id)
    .first();
}

// Bu fonksiyon başlangıç projesinde hazır verilmiştir
// Transaction sayesinde ekleme işlemleri bütün olarak yürütülür
async function ekle({ username, password, role_name }) {
  let created_user_id;

  await db.transaction(async trx => {
    let role_id_to_use;

    const [role] = await trx('roles')
      .where('role_name', role_name);

    if (role) {
      role_id_to_use = role.role_id;
    } else {
      const [role_id] = await trx('roles')
        .insert({ role_name });

      role_id_to_use = role_id;
    }

    const [user_id] = await trx('users')
      .insert({
        username,
        password,
        role_id: role_id_to_use,
      });

    created_user_id = user_id;
  });

  return idyeGoreBul(created_user_id);
}

module.exports = {
  ekle,
  bul,
  goreBul,
  idyeGoreBul,
};
