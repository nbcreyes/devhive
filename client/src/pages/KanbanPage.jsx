import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
      } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      toast.error('Failed to add card');
    }
  }

  async function handleDeleteCard(columnId, cardId) {
    try {
      const res = await api.delete(
        `/servers/${serverId}/kanban/columns/${columnId}/cards/${cardId}`
      );
      setBoard(res.data.board);
    } catch (err) {
      toast.error('Failed to delete card');
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading board...</p>
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="h-12 border-b flex items-center px-4 shrink-0">
        <h1 className="font-semibold">Kanban Board</h1>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 h-full">
            {board.columns.map((column) => (
              <div
                key={column._id}
                className="w-64 shrink-0 bg-muted/50 rounded-lg flex flex-col"
              >
                <div className="p-3 font-medium text-sm flex items-center justify-between">
                  <span>{column.title}</span>
                  <span className="text-muted-foreground text-xs">
                    {column.cards.length}
                  </span>
                </div>

                <Droppable droppableId={column._id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-12 rounded ${
                        snapshot.isDraggingOver ? 'bg-muted' : ''
                      }`}
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
                              className={`bg-background rounded p-3 text-sm shadow-sm group relative ${
                                snapshot.isDragging ? 'shadow-md' : ''
                              }`}
                            >
                              <p>{card.title}</p>
                              {card.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {card.description}
                                </p>
                              )}
                              <button
                                onClick={() => handleDeleteCard(column._id, card._id)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <div className="p-2">
                  {showCardInput[column._id] ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Card title"
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
                        className="text-sm"
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleAddCard(column._id)}
                          className="flex-1"
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setShowCardInput((prev) => ({
                              ...prev,
                              [column._id]: false,
                            }))
                          }
                        >
                          <X className="w-4 h-4" />
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
                      className="w-full flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"
                    >
                      <Plus className="w-3 h-3" />
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