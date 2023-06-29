const knex = require('../database/knex');
const { hash, compare } = require('bcryptjs');
const AppError = require('../utils/AppError');

class UsersController {
  async index(req, res) {
    const { name, email } = req.query;

    const query = knex('users');

    if (name) {
      query.whereLike('name', `%${name}%`);
    }

    if (email) {
      query.whereLike('email', `%${email}%`);
    }

    const users = await query;

    res.json(users);
  }

  async show(req, res) {
    const { id } = req.params;

    const user = await knex('users').where({ id }).first();

    res.json(user);
  }

  async create(req, res) {
    const { name, email, password } = req.body;

    if (!name) {
      throw new AppError('O nome é obrigatório');
    }

    if (!email) {
      throw new AppError('O e-mail é obrigatório');
    }

    if (!password) {
      throw new AppError('A senha é obrigatória');
    }

    const user = await knex('users').where({ email });

    if (user.length) {
      throw new AppError('Este e-mail já está em uso');
    }

    const passwordHashed = await hash(password, 8);

    await knex('users').insert({
      name,
      email,
      password: passwordHashed,
    });

    res.status(200).json();
  }

  async update(req, res) {
    const { name, email, password, old_password } = req.body;
    const { id } = req.params;

    const user = await knex('users').where({ id }).first();

    if (!user) {
      throw new AppError('Usuário não encontrado');
    }

    if (email) {
      const userWithEmail = await knex('users').where({ email }).first();

      if (userWithEmail && userWithEmail.id != id) {
        throw new AppError('Este e-mail já está em uso');
      }
    }

    user.name = name ?? user.name;
    user.email = email ?? user.email;

    if (password && !old_password) {
      throw new AppError(
        'Você precisa informar a senha antiga para definir a nova senha',
      );
    }

    if (password && old_password) {
      const checkPassword = await compare(old_password, user.password);

      if (!checkPassword) {
        throw new AppError('A senha antiga não confere');
      }

      user.password = await hash(password, 8);
    }

    await knex('users').where({ id }).update({
      name: user.name,
      email: user.email,
      password: user.password,
      updated_at: knex.fn.now(),
    });

    res.status(200).json();
  }

  async delete(req, res) {
    const { id } = req.params;
    await knex('users').where({ id }).delete();

    return res.json();
  }
}

module.exports = UsersController;
