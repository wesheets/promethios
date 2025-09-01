/**
 * Marketplace Item Card
 * 
 * Component for displaying marketplace items with integrated
 * buy/sell interactions via unified notification system
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
  Alert
} from '@mui/material';
import {
  ShoppingCart,
  Favorite,
  FavoriteOutlined,
  Share,
  MoreVert,
  LocationOn,
  Schedule,
  Verified,
  Star,
  Message,
  LocalOffer,
  Handshake
} from '@mui/icons-material';
import { useUserInteractions } from '../../hooks/useUserInteractions';
import { useAuth } from '../../context/AuthContext';

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  category: string;
  images: string[];
  location: string;
  seller: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    verified: boolean;
  };
  createdAt: string;
  status: 'available' | 'pending' | 'sold';
  tags: string[];
  negotiable: boolean;
  shipping: {
    available: boolean;
    cost: number;
    methods: string[];
  };
}

interface MarketplaceItemCardProps {
  item: MarketplaceItem;
  onViewDetails?: (itemId: string) => void;
  onContactSeller?: (sellerId: string) => void;
  showActions?: boolean;
}

const CONDITION_COLORS = {
  new: '#10b981',
  like_new: '#059669',
  good: '#f59e0b',
  fair: '#f97316',
  poor: '#ef4444'
};

const CONDITION_LABELS = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor'
};

export const MarketplaceItemCard: React.FC<MarketplaceItemCardProps> = ({
  item,
  onViewDetails,
  onContactSeller,
  showActions = true
}) => {
  const { currentUser } = useAuth();
  const { sendInteraction } = useUserInteractions();
  
  // State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showInquiryDialog, setShowInquiryDialog] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  
  // Form state
  const [offerAmount, setOfferAmount] = useState(item.price * 0.9); // Start at 90% of asking price
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwnItem = currentUser?.uid === item.seller.id;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFavorite = async () => {
    try {
      if (!currentUser?.uid || isOwnItem) return;

      setIsFavorited(!isFavorited);

      // Send favorite notification to seller
      await sendInteraction('item_favorite', item.seller.id, {
        itemId: item.id,
        itemTitle: item.title,
        message: `${currentUser.displayName || 'Someone'} favorited your item: "${item.title}"`,
        priority: 'low'
      });

    } catch (error) {
      console.error('❌ [MarketplaceItemCard] Error favoriting item:', error);
      setIsFavorited(!isFavorited); // Revert on error
    }
  };

  const handleBuyRequest = async () => {
    if (!currentUser?.uid || isOwnItem) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await sendInteraction('buy_request', item.seller.id, {
        itemId: item.id,
        itemTitle: item.title,
        offerPrice: item.price,
        quantity: buyQuantity,
        message: `I'd like to buy your item "${item.title}" for $${item.price}`,
        priority: 'high'
      });

      console.log('🛒 [MarketplaceItemCard] Buy request sent successfully');
      setShowBuyDialog(false);
      setBuyQuantity(1);

    } catch (error) {
      console.error('❌ [MarketplaceItemCard] Error sending buy request:', error);
      setError('Failed to send buy request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMakeOffer = async () => {
    if (!currentUser?.uid || isOwnItem) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await sendInteraction('price_negotiation', item.seller.id, {
        itemId: item.id,
        itemTitle: item.title,
        offerPrice: offerAmount,
        originalPrice: item.price,
        message: `I'd like to offer $${offerAmount} for "${item.title}" (asking $${item.price})`,
        priority: 'medium'
      });

      console.log('💰 [MarketplaceItemCard] Price offer sent successfully');
      setShowOfferDialog(false);
      setOfferAmount(item.price * 0.9);

    } catch (error) {
      console.error('❌ [MarketplaceItemCard] Error sending offer:', error);
      setError('Failed to send offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInquiry = async () => {
    if (!currentUser?.uid || isOwnItem || !inquiryMessage.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await sendInteraction('item_inquiry', item.seller.id, {
        itemId: item.id,
        itemTitle: item.title,
        message: inquiryMessage.trim(),
        priority: 'medium'
      });

      console.log('❓ [MarketplaceItemCard] Inquiry sent successfully');
      setShowInquiryDialog(false);
      setInquiryMessage('');

    } catch (error) {
      console.error('❌ [MarketplaceItemCard] Error sending inquiry:', error);
      setError('Failed to send inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Card sx={{ 
        maxWidth: 400, 
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        },
        transition: 'all 0.2s ease-in-out'
      }}>
        {/* Status Badge */}
        {item.status !== 'available' && (
          <Chip
            label={item.status.toUpperCase()}
            color={item.status === 'sold' ? 'error' : 'warning'}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 1,
              fontWeight: 'bold'
            }}
          />
        )}

        {/* Favorite Button */}
        {!isOwnItem && (
          <IconButton
            onClick={handleFavorite}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)'
              }
            }}
          >
            {isFavorited ? (
              <Favorite sx={{ color: '#ef4444' }} />
            ) : (
              <FavoriteOutlined />
            )}
          </IconButton>
        )}

        {/* Image */}
        <CardMedia
          component="img"
          height="200"
          image={item.images[0] || '/placeholder-item.jpg'}
          alt={item.title}
          sx={{ cursor: 'pointer' }}
          onClick={() => onViewDetails?.(item.id)}
        />

        <CardContent>
          {/* Title and Price */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography 
              variant="h6" 
              component="h3"
              sx={{ 
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' }
              }}
              onClick={() => onViewDetails?.(item.id)}
            >
              {item.title}
            </Typography>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', ml: 1 }}>
              {formatPrice(item.price, item.currency)}
            </Typography>
          </Box>

          {/* Condition and Negotiable */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={CONDITION_LABELS[item.condition]}
              size="small"
              sx={{
                backgroundColor: CONDITION_COLORS[item.condition],
                color: 'white',
                fontWeight: 'bold'
              }}
            />
            {item.negotiable && (
              <Chip
                label="Negotiable"
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
          </Box>

          {/* Description */}
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {item.description}
          </Typography>

          {/* Seller Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar 
              src={item.seller.avatar} 
              sx={{ width: 32, height: 32 }}
            >
              {item.seller.name.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {item.seller.name}
                </Typography>
                {item.seller.verified && (
                  <Verified sx={{ fontSize: 16, color: 'primary.main' }} />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Star sx={{ fontSize: 14, color: '#fbbf24' }} />
                <Typography variant="caption" color="text.secondary">
                  {item.seller.rating.toFixed(1)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Location and Time */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {item.location}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {getTimeAgo(item.createdAt)}
              </Typography>
            </Box>
          </Box>

          {/* Tags */}
          {item.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {item.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              ))}
              {item.tags.length > 3 && (
                <Typography variant="caption" color="text.secondary">
                  +{item.tags.length - 3} more
                </Typography>
              )}
            </Box>
          )}
        </CardContent>

        {showActions && !isOwnItem && item.status === 'available' && (
          <CardActions sx={{ px: 2, pb: 2 }}>
            <Button
              variant="contained"
              startIcon={<ShoppingCart />}
              onClick={() => setShowBuyDialog(true)}
              sx={{ flex: 1 }}
            >
              Buy Now
            </Button>
            
            {item.negotiable && (
              <Button
                variant="outlined"
                startIcon={<LocalOffer />}
                onClick={() => setShowOfferDialog(true)}
                sx={{ flex: 1 }}
              >
                Make Offer
              </Button>
            )}
            
            <IconButton onClick={() => setShowInquiryDialog(true)}>
              <Message />
            </IconButton>
            
            <IconButton onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </CardActions>
        )}
      </Card>

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); onViewDetails?.(item.id); }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); onContactSeller?.(item.seller.id); }}>
          Contact Seller
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Share sx={{ mr: 1 }} />
          Share Item
        </MenuItem>
      </Menu>

      {/* Buy Dialog */}
      <Dialog open={showBuyDialog} onClose={() => setShowBuyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Buy Item</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="h6" gutterBottom>
            {item.title}
          </Typography>
          <Typography variant="h5" color="primary" gutterBottom>
            {formatPrice(item.price, item.currency)}
          </Typography>
          
          <TextField
            label="Quantity"
            type="number"
            value={buyQuantity}
            onChange={(e) => setBuyQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1 }}
            fullWidth
            sx={{ mt: 2 }}
          />
          
          <Typography variant="h6" sx={{ mt: 2 }}>
            Total: {formatPrice(item.price * buyQuantity, item.currency)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBuyDialog(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleBuyRequest} 
            variant="contained"
            disabled={isSubmitting}
            startIcon={<ShoppingCart />}
          >
            {isSubmitting ? 'Sending...' : 'Send Buy Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Offer Dialog */}
      <Dialog open={showOfferDialog} onClose={() => setShowOfferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Make an Offer</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="h6" gutterBottom>
            {item.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Asking Price: {formatPrice(item.price, item.currency)}
          </Typography>
          
          <TextField
            label="Your Offer"
            type="number"
            value={offerAmount}
            onChange={(e) => setOfferAmount(parseFloat(e.target.value) || 0)}
            inputProps={{ min: 0, step: 0.01 }}
            fullWidth
            sx={{ mt: 2 }}
            helperText={`Suggested: ${formatPrice(item.price * 0.9, item.currency)} (10% off)`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOfferDialog(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleMakeOffer} 
            variant="contained"
            disabled={isSubmitting || offerAmount <= 0}
            startIcon={<LocalOffer />}
          >
            {isSubmitting ? 'Sending...' : 'Send Offer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inquiry Dialog */}
      <Dialog open={showInquiryDialog} onClose={() => setShowInquiryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ask a Question</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="h6" gutterBottom>
            {item.title}
          </Typography>
          
          <TextField
            label="Your Question"
            multiline
            rows={4}
            value={inquiryMessage}
            onChange={(e) => setInquiryMessage(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
            placeholder="Ask about condition, availability, shipping, etc..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInquiryDialog(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendInquiry} 
            variant="contained"
            disabled={isSubmitting || !inquiryMessage.trim()}
            startIcon={<Message />}
          >
            {isSubmitting ? 'Sending...' : 'Send Question'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MarketplaceItemCard;

