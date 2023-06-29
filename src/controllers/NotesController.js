const knex = require('../database/knex');
const AppError = require('../utils/AppError');

class NotesController {
  async index(req, res) {
    const { user_id, title, tags } = req.query;

    if (!user_id) {
      throw new AppError('o ID do usuário precisa ser informado');
    }

    const query = knex('notes')
      .select(['notes.*', knex.raw('GROUP_CONCAT(tags.name) AS tags')])
      .where({ 'notes.user_id': user_id })
      .innerJoin('tags', 'tags.note_id', 'notes.id')
      .groupBy('notes.id');

    if (title) {
      query.whereLike('title', `%${title}%`);
    }

    if (tags) {
      const filterTags = tags.split(',');
      query.whereIn('tags.name', filterTags);
    }

    const notes = await query;

    const noteWithTags = notes.map((note) => {
      const noteTags = note.tags.split(',');
      return {
        ...note,
        tags: noteTags,
      };
    });

    res.json(noteWithTags);
  }

  async show(req, res) {
    const { id } = req.params;

    const note = await knex('notes').where({ id }).first();

    if (!note) {
      throw new AppError('Nota não encontrada');
    }

    const tags = await knex('tags').where({ note_id: note.id });

    res.json({
      ...note,
      tags,
    });
  }

  async create(req, res) {
    const { title, description, rating, tags } = req.body;
    const { user_id } = req.params;

    if (!title) {
      throw new AppError('O título da nota é obrigatório');
    }

    const [note_id] = await knex('notes').insert({
      title,
      description,
      rating,
      user_id,
    });

    if (tags) {
      const newTags = tags.map((tag) => {
        return {
          note_id,
          user_id,
          name: tag,
        };
      });

      await knex('tags').insert(newTags);
    }

    res.status(201).json();
  }

  async update(req, res) {
    const { title, description, rating, tags } = req.body;
    const { id } = req.params;

    const note = await knex('notes').where({ id }).first();

    if (!note) {
      throw new AppError('Nota não encontrada');
    }

    note.title = title ?? note.title;
    note.description = description ?? note.description;
    note.rating = rating ?? note.rating;

    await knex('notes')
      .where({ id })
      .update({
        ...note,
        updated_at: knex.fn.now(),
      });

    if (tags) {
      await knex('tags').where({ note_id: id }).delete();

      const newTags = tags.map((tag) => {
        return {
          note_id: note.id,
          user_id: note.user_id,
          name: tag,
        };
      });

      await knex('tags').insert(newTags);
    }

    res.json();
  }

  async delete(req, res) {
    const { id } = req.params;

    await knex('notes').where({ id }).delete();

    res.json();
  }
}

module.exports = NotesController;
