import Kanban from '../models/Kanban.js';
import Member from '../models/Member.js';

/**
 * Gets or creates a Kanban board for a server.
 * @param {string} serverId
 * @returns {Promise<import('../models/Kanban.js').default>}
 */
async function getOrCreateBoard(serverId) {
  let board = await Kanban.findOne({ server: serverId });

  if (!board) {
    board = await Kanban.create({
      server: serverId,
      columns: [
        { title: 'Backlog', position: 0, cards: [] },
        { title: 'In Progress', position: 1, cards: [] },
        { title: 'In Review', position: 2, cards: [] },
        { title: 'Done', position: 3, cards: [] },
      ],
    });
  }

  return board;
}

/**
 * GET /api/servers/:serverId/kanban
 * Returns the Kanban board for a server.
 */
export async function getBoard(req, res, next) {
  try {
    const { serverId } = req.params;

    const membership = await Member.findOne({
      user: req.session.userId,
      server: serverId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    const board = await getOrCreateBoard(serverId);
    res.json({ board });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/servers/:serverId/kanban/columns
 * Adds a new column to the board.
 */
export async function addColumn(req, res, next) {
  try {
    const { serverId } = req.params;
    const { title } = req.body;

    const membership = await Member.findOne({
      user: req.session.userId,
      server: serverId,
    });

    if (!membership || membership.role === 'member') {
      return res.status(403).json({ error: 'Only admins and owners can add columns' });
    }

    const board = await getOrCreateBoard(serverId);

    board.columns.push({
      title,
      position: board.columns.length,
      cards: [],
    });

    await board.save();
    res.status(201).json({ board });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/servers/:serverId/kanban/columns/:columnId
 * Removes a column from the board.
 */
export async function deleteColumn(req, res, next) {
  try {
    const { serverId, columnId } = req.params;

    const membership = await Member.findOne({
      user: req.session.userId,
      server: serverId,
    });

    if (!membership || membership.role === 'member') {
      return res.status(403).json({ error: 'Only admins and owners can delete columns' });
    }

    const board = await Kanban.findOne({ server: serverId });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    board.columns = board.columns.filter((c) => c._id.toString() !== columnId);
    await board.save();

    res.json({ board });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/servers/:serverId/kanban/columns/:columnId/cards
 * Adds a card to a column.
 */
export async function addCard(req, res, next) {
  try {
    const { serverId, columnId } = req.params;
    const { title, description, labels, dueDate } = req.body;

    const membership = await Member.findOne({
      user: req.session.userId,
      server: serverId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    const board = await Kanban.findOne({ server: serverId });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const column = board.columns.id(columnId);
    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }

    column.cards.push({
      title,
      description: description || '',
      labels: labels || [],
      dueDate: dueDate || null,
      position: column.cards.length,
      assignees: [],
    });

    await board.save();
    res.status(201).json({ board });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/servers/:serverId/kanban/columns/:columnId/cards/:cardId
 * Updates a card.
 */
export async function updateCard(req, res, next) {
  try {
    const { serverId, columnId, cardId } = req.params;
    const { title, description, labels, dueDate, assignees } = req.body;

    const membership = await Member.findOne({
      user: req.session.userId,
      server: serverId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    const board = await Kanban.findOne({ server: serverId });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const column = board.columns.id(columnId);
    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }

    const card = column.cards.id(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (title !== undefined) card.title = title;
    if (description !== undefined) card.description = description;
    if (labels !== undefined) card.labels = labels;
    if (dueDate !== undefined) card.dueDate = dueDate;
    if (assignees !== undefined) card.assignees = assignees;

    await board.save();
    res.json({ board });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/servers/:serverId/kanban/columns/:columnId/cards/:cardId
 * Removes a card from a column.
 */
export async function deleteCard(req, res, next) {
  try {
    const { serverId, columnId, cardId } = req.params;

    const membership = await Member.findOne({
      user: req.session.userId,
      server: serverId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    const board = await Kanban.findOne({ server: serverId });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const column = board.columns.id(columnId);
    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }

    column.cards = column.cards.filter((c) => c._id.toString() !== cardId);
    await board.save();

    res.json({ board });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/servers/:serverId/kanban/move
 * Moves a card from one column to another.
 * This is called after a drag and drop action on the frontend.
 */
export async function moveCard(req, res, next) {
  try {
    const { serverId } = req.params;
    const { cardId, fromColumnId, toColumnId, toIndex } = req.body;

    const membership = await Member.findOne({
      user: req.session.userId,
      server: serverId,
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    const board = await Kanban.findOne({ server: serverId });
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const fromColumn = board.columns.id(fromColumnId);
    const toColumn = board.columns.id(toColumnId);

    if (!fromColumn || !toColumn) {
      return res.status(404).json({ error: 'Column not found' });
    }

    const cardIndex = fromColumn.cards.findIndex((c) => c._id.toString() === cardId);
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const [card] = fromColumn.cards.splice(cardIndex, 1);
    toColumn.cards.splice(toIndex, 0, card);

    await board.save();
    res.json({ board });
  } catch (err) {
    next(err);
  }
}