import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BlockRenderer } from '../BlockRenderer';
import { SortableBlock } from '../../builder/SortableBlock';

export function ContainerRenderer({ id, settings = {}, children, viewMode = 'desktop', store, products, categories, isEditor, onSelect, onDelete, selectedId }) {
    // Drop Zone Logic
    const { isOver, setNodeRef } = useDroppable({
        id: `container-drop-${id}`,
        data: {
            type: 'container',
            parentId: id, // Store the original block ID
            accepts: ['widget']
        },
        disabled: !id
    });

    // Helper to get responsive value
    const getValue = (key, fallback) => {
        if (!settings[key]) return fallback;
        if (typeof settings[key] === 'object') {
            return settings[key][viewMode] || settings[key]['desktop'] || fallback;
        }
        return settings[key] || fallback;
    };

    // Layout
    const direction = getValue('direction', 'column');
    const alignItems = getValue('alignItems', 'stretch');
    const justifyContent = getValue('justifyContent', 'start');
    const gap = getValue('gap', 0);
    const wrap = settings.wrap ? 'wrap' : 'nowrap';

    // Sizing
    const widthMode = getValue('widthMode', 'auto');
    const heightMode = getValue('heightMode', 'auto');

    let width = getValue('width', 'auto');
    if (widthMode === 'full') width = '100%';
    if (widthMode === 'screen') width = '100vw';
    if (widthMode === 'container') width = '100%';

    let height = getValue('height', 'auto');
    if (heightMode === 'fit') height = 'fit-content';
    if (heightMode === 'screen') height = '100vh';

    // Spacing
    const getSpacing = (type, side) => {
        const spacingObj = settings[type];
        if (!spacingObj) return '0px';
        const modeObj = spacingObj[viewMode] || spacingObj['desktop'];
        if (!modeObj) return '0px';
        return (modeObj[side] || 0) + 'px';
    };

    const style = {
        // Layout
        display: 'flex',
        flexDirection: direction,
        alignItems: alignItems,
        justifyContent: justifyContent === 'between' ? 'space-between' : justifyContent === 'around' ? 'space-around' : justifyContent,
        gap: `${gap}px`,
        flexWrap: wrap,

        // Sizing
        width: width,
        height: height,
        minHeight: getValue('minHeight', null) ? `${getValue('minHeight')}px` : undefined,
        maxWidth: getValue('maxWidth', null) ? `${getValue('maxWidth')}px` : (widthMode === 'container' ? '1280px' : undefined),

        // Spacing
        paddingTop: getSpacing('padding', 'top'),
        paddingRight: getSpacing('padding', 'right'),
        paddingBottom: getSpacing('padding', 'bottom'),
        paddingLeft: getSpacing('padding', 'left'),
        marginTop: getSpacing('margin', 'top'),
        marginRight: getSpacing('margin', 'right'),
        marginBottom: getSpacing('margin', 'bottom'),
        marginLeft: getSpacing('margin', 'left'),

        // Visual
        backgroundColor: settings.backgroundColor || 'transparent',
        borderWidth: settings.borderWidth ? `${settings.borderWidth}px` : '0px',
        borderColor: settings.borderColor || 'transparent',
        borderStyle: settings.borderStyle || 'solid',
        borderRadius: settings.borderRadius ? `${settings.borderRadius}px` : '0px',
        overflow: settings.overflow || 'visible',
    };

    // Shadow Class Map
    const getShadowClass = () => {
        switch (settings.shadow) {
            case 'sm': return 'shadow-sm';
            case 'md': return 'shadow-md';
            case 'lg': return 'shadow-lg';
            case 'xl': return 'shadow-xl';
            case 'inner': return 'shadow-inner';
            default: return '';
        }
    };

    if (widthMode === 'container') {
        style.marginLeft = 'auto';
        style.marginRight = 'auto';
    }

    const currentChildren = settings.children && Array.isArray(settings.children) ? settings.children : [];

    const renderChildren = () => {
        if (!currentChildren.length) {
            return null;
        }

        if (isEditor) {
            return (
                <SortableContext items={currentChildren.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {currentChildren.map(childBlock => (
                        <SortableBlock
                            key={childBlock.id}
                            block={childBlock}
                            viewMode={viewMode}
                            store={store}
                            products={products}
                            categories={categories}
                            isEditor={true}
                            isSelected={selectedId === childBlock.id}
                            onClick={() => onSelect && onSelect(childBlock)}
                            onDelete={onDelete ? () => onDelete(childBlock.id) : undefined}
                            onSelect={onSelect}
                            onDeleteItem={onDelete}
                        />
                    ))}
                </SortableContext>
            );
        }

        // View Mode (Public/Preview)
        return currentChildren.map(childBlock => (
            <BlockRenderer
                key={childBlock.id}
                {...childBlock}
                viewMode={viewMode}
                store={store}
                products={products}
                categories={categories}
            />
        ));
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`transition-all duration-200 ${getShadowClass()} ${isOver ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : ''}`}
        >
            {renderChildren()}
            {children}
        </div>
    );
}
