import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, X, AlertCircle, CheckCircle2, Clock, Inbox } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const COLUMN_TYPES = {
  backlog: { title: 'BACKLOG', icon: <Inbox size={16} />, color: 'border-black' },
  inProgress: { title: 'IN PROGRESS', icon: <Clock size={16} />, color: 'border-blue-500' },
  blocked: { title: 'BLOCKED', icon: <AlertCircle size={16} />, color: 'border-red-500' },
  shipped: { title: 'SHIPPED', icon: <CheckCircle2 size={16} />, color: 'border-green-500' }
};

export default function SprintPipeline({ project, user }) {
  const [columns, setColumns] = useState({
    backlog: [], inProgress: [], blocked: [], shipped: []
  });
  const [newTaskText, setNewTaskText] = useState("");

  useEffect(() => {
    if (!project?.id) return;
    const unsub = onSnapshot(doc(db, "projects", project.id), (docSnap) => {
      const data = docSnap.data();
      if (data?.pipeline) {
        setColumns(data.pipeline);
      }
    });
    return () => unsub();
  }, [project?.id]);

  const savePipeline = async (newColumns) => {
    setColumns(newColumns);
    const projectRef = doc(db, "projects", project.id);
    await updateDoc(projectRef, { pipeline: newColumns });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = [...columns[source.droppableId]];
    const destCol = [...columns[destination.droppableId]];
    const [movedTask] = sourceCol.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceCol.splice(destination.index, 0, movedTask);
      savePipeline({ ...columns, [source.droppableId]: sourceCol });
    } else {
      destCol.splice(destination.index, 0, movedTask);
      savePipeline({ ...columns, [source.droppableId]: sourceCol, [destination.droppableId]: destCol });
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = { id: uuidv4(), content: newTaskText, author: user?.displayName || 'Unknown' };
    const newColumns = { ...columns, backlog: [newTask, ...columns.backlog] };
    await savePipeline(newColumns);
    setNewTaskText("");
  };

  const deleteTask = async (taskId, colId) => {
    const newCol = columns[colId].filter(t => t.id !== taskId);
    await savePipeline({ ...columns, [colId]: newCol });
  };

  return (
    <div className="font-mono mt-6 animate-in fade-in duration-300">
      <form onSubmit={addTask} className="mb-6 flex gap-2">
        <input 
          type="text" 
          value={newTaskText} 
          onChange={(e) => setNewTaskText(e.target.value)} 
          placeholder="ENTER NEW TICKET (e.g. 'Refactor yield matrices')..."
          className="flex-1 border-2 border-black p-3 rounded-none outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-black text-white px-6 font-bold uppercase hover:bg-blue-600 transition-colors flex items-center gap-2">
          <Plus size={20} /> Deploy
        </button>
      </form>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {Object.entries(columns).map(([colId, tasks]) => (
            <div key={colId} className={`bg-gray-50 border-2 border-black border-t-8 ${COLUMN_TYPES[colId].color} p-4 min-h-[500px] flex flex-col`}>
              <div className="flex items-center gap-2 mb-4 font-black uppercase text-black">
                {COLUMN_TYPES[colId].icon} {COLUMN_TYPES[colId].title} <span className="ml-auto text-xs bg-black text-white px-2 py-0.5">{tasks.length}</span>
              </div>
              <Droppable droppableId={colId}>
                {(provided, snapshot) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200' : ''}`}>
                    {tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white border-2 border-black p-3 mb-3 relative group ${snapshot.isDragging ? 'shadow-[4px_4px_0_rgba(0,0,0,1)] -translate-y-1 -translate-x-1' : 'hover:bg-gray-100'}`}
                          >
                            <p className="text-sm font-bold text-black mb-3 pr-6">{task.content}</p>
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 border-t-2 border-dashed border-gray-200 pt-2">
                              Assignee: {task.author}
                            </div>
                            <button 
                              onClick={() => deleteTask(task.id, colId)}
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}