import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { BlockRenderer } from '../widgets/BlockRenderer';

export function SortableBlock({ block, onDelete, isSelected, onClick, viewMode, store, products, categories, isEditor }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`group relative border-2 transition-all cursor-default
                ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-transparent hover:border-indigo-200'}
            `}
        >
            <div className={`absolute -left-10 top-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                <div {...attributes} {...listeners} className="p-2 bg-white shadow-xl rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4" />
                </div>
                {onDelete && (
                    <button onClick={onDelete} className="p-2 bg-white shadow-xl rounded-lg border border-slate-200 text-slate-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            <BlockRenderer
                id={block.id}
                type={block.type}
                settings={block.settings}
                viewMode={viewMode}
                store={store}
                products={products}
                categories={categories}
                isEditor={isEditor}
                onSelect={props.onSelect}
                onDelete={props.onDeleteItem}
            />
        </div>
    );
}
