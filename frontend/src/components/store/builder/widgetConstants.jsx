import React from 'react';
import {
    Type, Image as ImageIcon, Layout, Box, Play, ShoppingBag, ShoppingCart, Search, MessageSquare
} from 'lucide-react';
import { genId } from '../widgets/Shared';

export const WIDGET_CATEGORIES = [
    {
        name: 'Basic',
        widgets: [
            { type: 'navbar', icon: <Box className="h-4 w-4" />, label: 'Navbar' },
            { type: 'text', icon: <Type className="h-4 w-4" />, label: 'Text Block' },
            { type: 'heading', icon: <Type className="h-5 w-5" />, label: 'Heading' },
            { type: 'image', icon: <ImageIcon className="h-4 w-4" />, label: 'Image' },
            { type: 'button', icon: <Play className="h-4 w-4" />, label: 'Button' },
        ]
    },
    {
        name: 'Layout',
        widgets: [
            { type: 'container', icon: <Layout className="h-4 w-4" />, label: 'Container' },
            { type: 'hero', icon: <Layout className="h-4 w-4" />, label: 'Hero Banner' },
            { type: 'section', icon: <Layout className="h-4 w-4" />, label: 'Section' },
            { type: 'spacer', icon: <Box className="h-4 w-4" />, label: 'Spacer' },
        ]
    },
    {
        name: 'Shopify Core',
        widgets: [
            { type: 'product_grid', icon: <ShoppingBag className="h-4 w-4" />, label: 'Product Grid' },
            { type: 'cart_list', icon: <ShoppingCart className="h-4 w-4" />, label: 'Cart Items' },
            { type: 'product_detail', icon: <Search className="h-4 w-4" />, label: 'Product Info' },
            { type: 'product_reviews', icon: <MessageSquare className="h-4 w-4" />, label: 'Reviews' },
            { type: 'related_products', icon: <Box className="h-4 w-4" />, label: 'Related Products' },
        ]
    }
];

export const getWidgetDefaults = (type) => {
    return type === 'navbar' ? {
        bgColor: '#ffffff',
        textColor: '#1e293b',
        hoverColor: '#4f46e5',
        activeColor: '#4f46e5',
        borderColor: '#e2e8f0',
        borderRadius: '0px',
        borderWidth: '0px',
        shadow: 'soft',
        opacity: 1,
        height: '70px',
        paddingX: '20px',
        gap: '24px',
        maxWidth: '1200px',
        alignment: 'space-between',
        logoWidth: '120px',
        showStoreName: false,
        logoGap: '12px',
        sticky: 'always',
        stickyMode: 'always',
        hamburgerPC: false,
        hamburgerTablet: true,
        hamburgerMobile: true,
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        fontWeight: '600',
        menuItems: [
            { id: 'm1', label: 'Home', type: 'page', value: 'home' },
            { id: 'm2', label: 'Shop', type: 'page', value: 'shop' }
        ]
    } : type === 'container' ? {
        direction: { desktop: 'column', tablet: 'column', mobile: 'column' },
        alignItems: { desktop: 'stretch', tablet: 'stretch', mobile: 'stretch' },
        justifyContent: { desktop: 'start', tablet: 'start', mobile: 'start' },
        gap: { desktop: 16, tablet: 16, mobile: 12 },
        padding: {
            desktop: { top: 20, right: 20, bottom: 20, left: 20 },
            tablet: { top: 16, right: 16, bottom: 16, left: 16 },
            mobile: { top: 12, right: 12, bottom: 12, left: 12 }
        },
        margin: {
            desktop: { top: 0, right: 0, bottom: 0, left: 0 },
            tablet: { top: 0, right: 0, bottom: 0, left: 0 },
            mobile: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        widthMode: 'auto',
        heightMode: 'auto',
        backgroundColor: '#b0bbc9',
        shadow: 'none',
        children: []
    } : type === 'hero' ? {
        title: 'Elevate Your Style',
        subtitle: 'Discover our premium winter collection.',
        showContentAboveImage: true,
        backgroundImage: '',
        primaryBtnText: 'Shop Now',
        primaryBtnLink: '',
        secondaryBtnText: '',
        secondaryBtnLink: '',
        heightMode: 'medium',
        customHeight: '500px',
        hAlignment: 'center',
        vAlignment: 'center',
        maxContentWidth: '800px',
        overlayColor: '#000000',
        overlayOpacity: 0.4,
        useGradient: false,
        borderRadius: '0px',
        headingFontFamily: 'Inter, sans-serif',
        subheadingFontFamily: 'Inter, sans-serif',
        headingSize: '48px',
        headingColor: '#ffffff',
        subheadingSize: '18px',
        subheadingColor: '#e2e8f0',
        btnBgColor: '#ffffff',
        btnTextColor: '#000000',
        btnPaddingX: '32px',
        btnPaddingY: '16px',
        btnFontSize: '16px',
        btnBorderRadius: '9999px',
        btnMarginTop: '24px',
        secondaryBtnBgColor: 'transparent',
        secondaryBtnTextColor: '#ffffff',
        mobileHeight: '400px',
        mobileAlignment: 'center'
    } : type === 'product_grid' ? {
        title: 'Featured Collection',
        categoryId: 'all',
        limit: 8,
        columns: {
            desktop: 4,
            tablet: 3,
            mobile: 2
        }
    } : type === 'product_reviews' ? {
        layoutMode: 'chart',
        allowVerifiedOnly: false,
        allowMedia: true,
        hideIfEmpty: false,
        sortOrder: 'newest',
        starColor: '#FACC15',
        buttonColor: '#4F46E5',
        textColor: '#1F2937'
    } : type === 'related_products' ? {
        relatedTitle: 'You might also like',
        relatedLimit: 4,
        showPrice: true,
        itemGap: 'normal'
    } : type === 'checkout_form' ? {
        primaryColor: '#4f46e5',
        primaryTextColor: '#ffffff',
        backgroundColor: '#ffffff',
        textColor: '#0f172a'
    } : {
        title: type === 'hero' ? 'New Hero Banner' : 'New Title',
        content: 'Sample content for your ' + type
    };
};
