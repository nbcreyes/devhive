import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X, LayoutDashboard } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function KanbanPage() {
  const { serverId } = useParams();
  const [board, setBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newCardInputs, setNewCardInputs] = useState({});
  const [showCardInput, setShowCardInput] = useState({});

  useEffect(() => {
    async function loadBoard() {
      try {
        const res = await api.get(`/servers/${serverId}/kanban`);
        setBoard(res.data.board);
      } catch {
        toast.error('Failed to load board');
      } finally {
        setIsLoading(false);
      }
    }
    loadBoard();
  }, [serverId]);

  async function handleDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    try {
      const res = await api.patch(`/servers/${serverId}/kanban/move`, {
        cardId: draggableId,
        fromColumnId: source.droppableId,
        toColumnId: destination.droppableId,
        toIndex: destination.index,
      });
      setBoard(res.data.board);
    } catch {
      toast.error('Failed to move card');
    }
  }

  async function handleAddCard(columnId) {
    const title = newCardInputs[columnId];
    if (!title?.trim()) return;
    try {
      const res = await api.post(
        `/servers/${serverId}/kanban/columns/${columnId}/cards`,
        { title: title.trim() }
      );
      setBoard(res.data.board);
      setNewCardInputs((prev) => ({ ...prev, [columnId]: '' }));
      setShowCardInput((prev) => ({ ...prev, [columnId]: false }));
    } catch {
      toast.error('Failed to add card');
    }
  }

  async function handleDeleteCard(columnId, cardId) {
    try {
      const res = await api.delete(
        `/servers/${serverId}/kanban/columns/${columnId}/cards/${cardId}`
      );
      setBoard(res.data.board);
    } catch {
      toast.error('Failed to delete card');
    }
  }

  const columnColors = {
    0: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    1: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    2: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    3: 'text-green-400 bg-green-400/10 border-green-400/20',
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading board...</p>
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="h-12 border-b border-border flex items-center px-4 gap-2 shrink-0">
        <LayoutDashboard className="w-4 h-4 text-primary" />
        <h1 className="font-semibold text-sm">Kanban Board</h1>
        <span className="text-xs text-muted-foreground ml-1">
          {board.columns.reduce((acc, col) => acc + col.cards.length, 0)} cards
        </span>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-3 h-full min-w-max">
            {board.columns.map((column, colIndex) => (
              <div
                key={column._id}
                className="w-64 shrink-0 flex flex-col rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full border',
                      columnColors[colIndex % 4]
                    )}>
                      {column.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {column.cards.length}
                  </span>
                </div>

                <Droppable droppableId={column._id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'flex-1 p-2 space-y-2 overflow-y-auto min-h-16 transition-colors',
                        snapshot.isDraggingOver && 'bg-primary/5'
                      )}
                    >
                      {column.cards.map((card, index) => (
                        <Draggable
                          key={card._id}
                          draggableId={card._id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                'bg-background border border-border rounded-lg p-3 text-sm group relative transition-all',
                                snapshot.isDragging && 'shadow-lg border-primary/30 rotate-1'
                              )}
                            >
                              <p className="font-medium text-sm leading-snug pr-5">{card.title}</p>
                              {card.description && (
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                  {card.description}
                                </p>
                              )}
                              <button
                                onClick={() => handleDeleteCard(column._id, card._id)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {column.cards.length === 0 && !showCardInput[column._id] && (
                        <div className="h-16 flex items-center justify-center rounded-lg border border-dashed border-border">
                          <p className="text-xs text-muted-foreground">No cards yet</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>

                <div className="p-2 border-t border-border">
                  {showCardInput[column._id] ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Card title..."
                        value={newCardInputs[column._id] || ''}
                        onChange={(e) =>
                          setNewCardInputs((prev) => ({
                            ...prev,
                            [column._id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCard(column._id);
                          if (e.key === 'Escape')
                            setShowCardInput((prev) => ({
                              ...prev,
                              [column._id]: false,
                            }));
                        }}
                        autoFocus
                        className="text-xs bg-background border-border focus:border-primary focus:ring-0 h-8"
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleAddCard(column._id)}
                          className="flex-1 h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Add card
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            setShowCardInput((prev) => ({
                              ...prev,
                              [column._id]: false,
                            }))
                          }
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setShowCardInput((prev) => ({
                          ...prev,
                          [column._id]: true,
                        }))
                      }
                      className="w-full flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded hover:bg-secondary transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add card
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}

export default KanbanPage;