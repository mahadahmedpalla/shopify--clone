import React from 'react';
import {
    Type, Image as ImageIcon, Layout, Box, Play, ShoppingBag, ShoppingCart, Search, MessageSquare, Boxes
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
        ]
    },
    {
        name: 'Layout',
        widgets: [
            { type: 'container', icon: <Layout className="h-4 w-4" />, label: 'Container' },
            { type: 'hero', icon: <Layout className="h-4 w-4" />, label: 'Hero Banner' },
            { type: 'hero_slideshow', icon: <Play className="h-4 w-4" />, label: 'Hero Slideshow' },
            { type: 'section', icon: <Layout className="h-4 w-4" />, label: 'Section' },
            { type: 'spacer', icon: <Box className="h-4 w-4" />, label: 'Spacer' },
        ]
    },
    {
        name: 'Shopify Core',
        widgets: [
            { type: 'product_grid', icon: <ShoppingBag className="h-4 w-4" />, label: 'Product Grid' },
            { type: 'category_list', icon: <Boxes className="h-4 w-4" />, label: 'Category List' },

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
    } : type === 'hero_slideshow' ? {
        slides: [
            { id: 1, title: 'Summer Collection', subtitle: 'New Arrivals are here', btnText: 'Shop Summer', image: '' },
            { id: 2, title: 'Exclusive Deals', subtitle: 'Up to 50% off', btnText: 'View Deals', image: '' }
        ],
        showArrows: true,
        showDots: true,
        autoplay: true,
        autoplayDuration: 5000,
        heightMode: 'full',
        overlayColor: '#000000',
        overlayOpacity: 0.3,
        overlayColorGlobal: true,
        headingSize: '64px',
        headingColor: '#ffffff',
        btnBgColor: '#ffffff',
        btnTextColor: '#000000',
        btnBorderRadius: '99px'
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
    } : type === 'image' ? {
        src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop',
        alt: 'Product Image',
        // Size & Fit
        objectFit: 'contain',
        aspectRatio: 'auto', // auto, 1/1, 4/3, 16/9, 3/4, custom
        customRatio: 1.5,
        widthMode: 'auto', // auto, full, custom
        width: '100%',
        heightMode: 'auto', // auto, fixed
        height: '300px',
        // Layout
        alignment: 'center', // left, center, right
        // Style
        borderRadius: 0,
        borderWidth: 0,
        borderColor: '#000000',
        borderStyle: 'solid',
        shadow: 'none',
        // Overlay
        overlayColor: '#000000',
        overlayOpacity: 0,
        // Interaction
        clickAction: 'none', // none, link, lightbox
        linkUrl: '',
        hoverEffect: 'none', // zoom, fade, blur, lift, overlay
    } : type === 'checkout_form' ? {
        primaryColor: '#4f46e5',
        primaryTextColor: '#ffffff',
        backgroundColor: '#ffffff',
        textColor: '#0f172a'
    } : type === 'category_list' ? {
        layout: 'horizontal',
        columns: { desktop: 6, tablet: 4, mobile: 2 },
        rowGap: 16,
        columnGap: 16,
        showImage: true,
        showTitle: true,
        imageRatio: 'circle',
        imageFit: 'cover',
        hoverEffect: 'none',
        contentAlignment: 'center',
        titleFontSize: 14,
        titleFontWeight: 'font-medium',
        titleColor: '#1e293b',
        sectionPaddingTop: 20,
        sectionPaddingBottom: 20,
        sectionPaddingX: 20,
        sectionBackgroundColor: 'transparent',
    } : {
        title: type === 'hero' ? 'New Hero Banner' : 'New Title',
        content: 'Sample content for your ' + type
    };
};
