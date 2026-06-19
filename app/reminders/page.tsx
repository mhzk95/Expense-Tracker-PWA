"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { useReminders } from "@/hooks/useReminders";
import { useResearch } from "@/hooks/useResearch";
import { Bell, CheckCircle2, Clock, AlertTriangle, AlertCircle, Plus, Calendar, X, Link2, Flag, ArrowUpCircle, Trash2 } from "lucide-react";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { AnimatePresence, motion } from "framer-motion";

function isDateOverdue(dateStr?: string) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  return due.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function isDateToday(dateStr?: string) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  return due.getDate() === now.getDate() && due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
}

function isDateUpcoming(dateStr?: string) {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  // Due tomorrow or later
  return due.getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
}

export default function RemindersPage() {
  const router = useRouter();
  const { reminders, addReminder, updateReminder, deleteReminder } = useReminders();
  const { items: researchItems } = useResearch();
  const [filter, setFilter] = useState<"pending" | "completed">("pending");
  const [newTaskInput, setNewTaskInput] = useState("");
  const [snoozeOpenId, setSnoozeOpenId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesEditValue, setNotesEditValue] = useState("");
  const [notesEditPriority, setNotesEditPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [notesEditDueDate, setNotesEditDueDate] = useState<string>("");

  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>("");
  const [showTaskOptions, setShowTaskOptions] = useState(false);

  const filteredReminders = reminders.filter(r => r.status === filter);

  // Grouping
  const groups = useMemo(() => {
    if (filter === "completed") {
      return { Completed: filteredReminders.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) };
    }
    
    const overdue = filteredReminders.filter(r => isDateOverdue(r.dueDate));
    const today = filteredReminders.filter(r => isDateToday(r.dueDate));
    const upcoming = filteredReminders.filter(r => isDateUpcoming(r.dueDate));
    const someday = filteredReminders.filter(r => !r.dueDate);
    
    // Sort logic by priority
    const sortByPriority = (arr: any[]) => arr.sort((a, b) => {
      const p = { critical: 3, high: 2, medium: 1, low: 0 } as any;
      return (p[b.priority] || 0) - (p[a.priority] || 0);
    });

    return {
      "Overdue": sortByPriority(overdue),
      "Today": sortByPriority(today),
      "Upcoming": sortByPriority(upcoming),
      "Someday": sortByPriority(someday),
    };
  }, [filteredReminders, filter]);

  const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (("key" in e && e.key === "Enter" && newTaskInput.trim()) || ("type" in e && e.type === "click" && newTaskInput.trim())) {
      addReminder({
        id: crypto.randomUUID(),
        title: newTaskInput.trim(),
        priority: newTaskPriority,
        contextTags: [],
        isRecurring: false,
        status: "pending",
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : new Date().toISOString(),
      });
      setNewTaskInput("");
      setNewTaskDueDate("");
      setNewTaskPriority("medium");
      setShowTaskOptions(false);
    }
  };

  const handleSnooze = (id: string, preset: "later" | "tomorrow" | "weekend" | "next_week") => {
    const now = new Date();
    let newDate = new Date();
    if (preset === "later") {
      newDate.setHours(now.getHours() + 4);
    } else if (preset === "tomorrow") {
      newDate.setDate(now.getDate() + 1);
      newDate.setHours(9, 0, 0, 0);
    } else if (preset === "weekend") {
      const daysToSaturday = 6 - now.getDay();
      newDate.setDate(now.getDate() + (daysToSaturday >= 0 ? daysToSaturday : 6));
      newDate.setHours(10, 0, 0, 0);
    } else if (preset === "next_week") {
      newDate.setDate(now.getDate() + 7);
      newDate.setHours(9, 0, 0, 0);
    }
    
    updateReminder(id, { dueDate: newDate.toISOString() });
    setSnoozeOpenId(null);
  };

  const handleToggleChecklist = (id: string, notes: string, toggleIndex: number, checked: boolean) => {
    let currentIdx = 0;
    const newNotes = notes.split('\n').map(line => {
       if (line.match(/^(\s*)- \[([ xX])\] (.*)/)) {
         if (currentIdx === toggleIndex) {
            currentIdx++;
            return line.replace(/- \[([ xX])\]/, checked ? '- [x]' : '- [ ]');
         }
         currentIdx++;
       }
       return line;
    }).join('\n');
    updateReminder(id, { notes: newNotes });
  };

  const renderNotes = (id: string, notes: string) => {
    const lines = notes.split('\n');
    let checkboxIndex = 0;
    return lines.map((line, i) => {
      const match = line.match(/^(\s*)- \[([ xX])\] (.*)/);
      if (match) {
        const [, indent, checkedStr, text] = match;
        const checked = checkedStr.toLowerCase() === 'x';
        const currentIndex = checkboxIndex++;
        return (
          <div key={i} className={`flex items-start gap-2 mt-2 ${indent}`}>
            <input 
              type="checkbox" 
              checked={checked} 
              onChange={(e) => handleToggleChecklist(id, notes, currentIndex, e.target.checked)} 
              className="mt-1 h-4 w-4 appearance-none rounded border border-slate-600 bg-slate-800 checked:bg-violet-500 checked:border-violet-500 relative cursor-pointer before:content-[''] before:absolute before:inset-0 before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjIwIDYgOSAxNyA0IDEyIj48L3BvbHlsaW5lPjwvc3ZnPg==')] before:bg-center before:bg-no-repeat before:bg-[length:12px_12px] checked:before:opacity-100 before:opacity-0 transition-all"
            />
            <span className={`text-sm ${checked ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{text}</span>
          </div>
        );
      }
      return <p key={i} className="text-sm text-slate-400 mt-2 min-h-[1.25rem]">{line}</p>;
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Reminders"
        subtitle={`${filteredReminders.length} ${filter} tasks`}
        action={
          <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button onClick={() => setFilter("pending")} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === "pending" ? "bg-violet-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"}`}>Pending</button>
            <button onClick={() => setFilter("completed")} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === "completed" ? "bg-violet-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"}`}>Completed</button>
          </div>
        }
      />

      {filter === "pending" && (
        <div className="relative mb-8 group space-y-2">
          <div className="relative">
            <Plus className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-violet-500 group-focus-within:text-violet-400 transition-colors" />
            <input 
              type="text" 
              value={newTaskInput}
              onChange={e => setNewTaskInput(e.target.value)}
              onKeyDown={handleAddTask}
              onFocus={() => setShowTaskOptions(true)}
              placeholder="Add a new task (Press Enter)..." 
              className="w-full et-input rounded-2xl py-4 pl-12 pr-12 shadow-lg shadow-violet-500/5"
            />
            {newTaskInput && (
              <button onClick={handleAddTask} className="absolute right-3 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-500 text-white p-1.5 rounded-lg transition-colors">
                <ArrowUpCircle className="h-5 w-5" />
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {showTaskOptions && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-center gap-3 glass-card p-3"
              >
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <input 
                    type="datetime-local" 
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
                      } catch (err) {}
                    }}
                    className="et-input text-xs rounded-lg px-2 py-1.5 w-full cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-slate-400 shrink-0" />
                  <select 
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="et-input text-xs rounded-lg px-2 py-1.5"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                </div>
                <button onClick={() => setShowTaskOptions(false)} className="p-1 hover:bg-slate-800 rounded-md ml-auto">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {filteredReminders.length === 0 && filter === "pending" ? (
        <div className="text-center p-12 glass-card shadow-inner">
          <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/80" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Inbox Zero</h3>
          <p className="text-sm text-slate-400">You have completely cleared your task list.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([groupName, items]) => {
            if (items.length === 0) return null;
            
            const groupColor = groupName === "Overdue" ? "text-red-400 border-red-500/20 bg-red-500/10" : 
                               groupName === "Today" ? "text-violet-400 border-violet-500/20 bg-violet-500/10" : 
                               groupName === "Upcoming" ? "text-blue-400 border-blue-500/20 bg-blue-500/10" : 
                               "text-slate-400 border-slate-800 bg-slate-800/50";

            return (
              <div key={groupName} className="space-y-3">
                {filter === "pending" && (
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 px-1">
                    <div className={`h-2 w-2 rounded-full border ${groupColor}`} />
                    {groupName} <span className="text-slate-600 font-medium">({items.length})</span>
                  </h4>
                )}
                
                <AnimatePresence mode="popLayout">
                  {items.map((reminder: any) => (
                    <AnimatedCard key={reminder.id} className="w-full relative group">
                      <div className={`p-4 flex items-start gap-4 transition-all ${
                        reminder.priority === 'critical' ? 'glass-card rounded-2xl interactive ring-1 ring-red-500/50 bg-red-950/10' :
                        reminder.priority === 'high' ? 'glass-card rounded-2xl interactive ring-1 ring-orange-500/50 bg-orange-950/10' :
                        'glass-card rounded-2xl interactive'
                      }`}>
                        <button 
                          onClick={() => updateReminder(reminder.id, { status: reminder.status === 'pending' ? 'completed' : 'pending' })}
                          className={`mt-1 flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            reminder.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white scale-110' : 'border-slate-500 text-transparent hover:border-violet-500 hover:bg-violet-500/10'
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        
                        <div className="flex-1 min-w-0 pr-10 cursor-pointer" onClick={() => setExpandedId(expandedId === reminder.id ? null : reminder.id)}>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium leading-snug ${reminder.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'}`}>
                              {reminder.title}
                            </h3>
                            {reminder.priority === 'critical' && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                            {reminder.priority === 'high' && <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />}
                            {reminder.notes && reminder.notes.length > 0 && expandedId !== reminder.id && (
                              <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded ml-1 border border-slate-700">Has Notes</span>
                            )}
                          </div>
                          
                          {/* Tags */}
                          {reminder.contextTags && reminder.contextTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {reminder.contextTags.map((tag: string) => (
                                <span key={tag} className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Contextual Deep Link Mini-Card */}
                          {reminder.linkedItemId && reminder.linkedItemType === "research" && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                const linkedItem = researchItems.find(i => i.id === reminder.linkedItemId);
                                if (linkedItem) {
                                  router.push(`/research?searchQuery=${encodeURIComponent(linkedItem.title || "")}`);
                                } else {
                                  router.push('/research');
                                }
                              }}
                              className="mt-3 p-2 bg-slate-950/50 border border-slate-800 rounded-lg flex items-center gap-3 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
                            >
                              <div className="p-1.5 bg-violet-500/20 text-violet-400 rounded-md shrink-0">
                                <Link2 className="h-3 w-3" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Linked Research</p>
                                <p className="text-xs text-slate-300 font-medium truncate">
                                  {researchItems.find(i => i.id === reminder.linkedItemId)?.title || "Unknown Item"}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Expanded Notes Section */}
                          <AnimatePresence>
                            {expandedId === reminder.id && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: "auto" }} 
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mt-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="border-t border-slate-800 pt-3 pb-1">
                                  {editingNotesId === reminder.id ? (
                                    <div className="space-y-3">
                                      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                                          <input 
                                            type="datetime-local" 
                                            value={notesEditDueDate}
                                            onChange={(e) => setNotesEditDueDate(e.target.value)}
                                            onClick={(e) => {
                                              try {
                                                if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
                                              } catch (err) {}
                                            }}
                                            className="et-input text-xs rounded-lg px-2 py-1.5 w-full cursor-pointer"
                                          />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Flag className="h-4 w-4 text-slate-400 shrink-0" />
                                          <select 
                                            value={notesEditPriority}
                                            onChange={(e) => setNotesEditPriority(e.target.value as any)}
                                            className="et-input text-xs rounded-lg px-2 py-1.5"
                                          >
                                            <option value="low">Low Priority</option>
                                            <option value="medium">Medium Priority</option>
                                            <option value="high">High Priority</option>
                                            <option value="critical">Critical Priority</option>
                                          </select>
                                        </div>
                                      </div>
                                      <textarea
                                        autoFocus
                                        value={notesEditValue}
                                        onChange={(e) => setNotesEditValue(e.target.value)}
                                        placeholder="- [ ] Subtask 1&#10;- [x] Completed task&#10;Some notes here..."
                                        className="w-full h-32 et-input rounded-xl p-3 text-sm resize-none"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button 
                                          onClick={() => setEditingNotesId(null)}
                                          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          onClick={() => {
                                            updateReminder(reminder.id, { 
                                              notes: notesEditValue,
                                              priority: notesEditPriority,
                                              dueDate: notesEditDueDate ? new Date(notesEditDueDate).toISOString() : reminder.dueDate
                                            });
                                            setEditingNotesId(null);
                                          }}
                                          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors"
                                        >
                                          Save All
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="group/notes">
                                      {reminder.notes ? (
                                        <div className="pr-4">
                                          {renderNotes(reminder.id, reminder.notes)}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-slate-500 italic">No notes or checklists added.</p>
                                      )}
                                      <button 
                                        onClick={() => {
                                          setNotesEditValue(reminder.notes || "");
                                          setNotesEditPriority(reminder.priority || "medium");
                                          
                                          if (reminder.dueDate) {
                                            // Format for datetime-local input (YYYY-MM-DDThh:mm)
                                            const d = new Date(reminder.dueDate);
                                            const tzOffset = d.getTimezoneOffset() * 60000;
                                            const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
                                            setNotesEditDueDate(localISOTime);
                                          } else {
                                            setNotesEditDueDate("");
                                          }
                                          
                                          setEditingNotesId(reminder.id);
                                        }}
                                        className="mt-3 text-[11px] font-medium uppercase tracking-wider text-violet-400 hover:text-violet-300"
                                      >
                                        {reminder.notes ? "Edit Details & Notes" : "+ Add Notes & Details"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Actions */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {reminder.status === "pending" && (
                            <button 
                              onClick={() => setSnoozeOpenId(snoozeOpenId === reminder.id ? null : reminder.id)}
                              className="p-1.5 bg-slate-800 text-slate-400 hover:bg-violet-500/20 hover:text-violet-400 rounded-full transition-colors"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteReminder(reminder.id); }}
                            className="p-1.5 bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                            
                          {snoozeOpenId === reminder.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9, x: 10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                className="absolute right-10 top-0 bg-slate-800 border border-slate-700 shadow-xl rounded-xl overflow-hidden w-40 z-20"
                              >
                                <div className="p-2 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/50">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Snooze</span>
                                  <button onClick={() => setSnoozeOpenId(null)} className="text-slate-500 hover:text-white"><X className="h-3 w-3"/></button>
                                </div>
                                <div className="flex flex-col p-1">
                                  <button onClick={() => handleSnooze(reminder.id, "later")} className="text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-violet-500/20 hover:text-violet-300 rounded-lg transition-colors">Later Today (+4h)</button>
                                  <button onClick={() => handleSnooze(reminder.id, "tomorrow")} className="text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-violet-500/20 hover:text-violet-300 rounded-lg transition-colors">Tomorrow Morning</button>
                                  <button onClick={() => handleSnooze(reminder.id, "weekend")} className="text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-violet-500/20 hover:text-violet-300 rounded-lg transition-colors">This Weekend</button>
                                  <button onClick={() => handleSnooze(reminder.id, "next_week")} className="text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-violet-500/20 hover:text-violet-300 rounded-lg transition-colors">Next Week</button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                      </div>
                    </AnimatedCard>
                  ))}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
