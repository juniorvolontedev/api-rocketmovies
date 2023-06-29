const knex = require('../database/knex');
const AppError = require('../utils/AppError');

class TagsController {
  async index(req, res) {
    const { user_id } = req.params;

    const tags = await knex('tags').distinct('name').where({ user_id });

    res.json(tags);
  }
}

module.exports = TagsController;
