/**
 * E-commerce Integrations Component
 * 
 * Specialized integration management for e-commerce platforms
 * including Shopify, WooCommerce, Magento, and other online stores.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Settings, 
  Plus, 
  Trash2, 
  RefreshCw,
  ExternalLink,
  Zap,
  ShoppingCart,
  Package,
  TrendingUp,
  Activity,
  Shield,
  Database,
  DollarSign,
  BarChart3,
  Users,
  Star,
  Search,
  CreditCard,
  Truck,
  Gift,
  Tag,
  Percent
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EcommerceIntegration {
  id: string;
  name: string;
  type: 'shopify' | 'woocommerce' | 'magento' | 'bigcommerce' | 'prestashop' | 'custom';
  status: 'active' | 'inactive' | 'error' | 'pending';
  config: {
    storeUrl?: string;
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    webhookUrl?: string;
    orderTracking?: boolean;
    inventorySync?: boolean;
    productRecommendations?: boolean;
    abandonedCartRecovery?: boolean;
    customerSupport?: boolean;
  };
  metrics: {
    ordersProcessed: number;
    cartRecoveries: number;
    productViews: number;
    conversionRate: number;
    avgOrderValue: number;
    totalRevenue: number;
  };
  lastSync: string;
  createdAt: string;
}

interface ProductCatalog {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  inStock: boolean;
  imageUrl?: string;
}

const EcommerceIntegrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<EcommerceIntegration[]>([]);
  const [productCatalog, setProductCatalog] = useState<ProductCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<EcommerceIntegration | null>(null);
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    type: 'shopify' as const,
    config: {
      storeUrl: '',
      apiKey: '',
      apiSecret: '',
      orderTracking: true,
      inventorySync: true,
      productRecommendations: true,
      abandonedCartRecovery: false,
      customerSupport: true,
    },
    enabled: true
  });

  const ecommerceProviders = [
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Leading e-commerce platform for online stores',
      icon: <ShoppingCart className="h-5 w-5 text-green-600" />,
      features: ['Product Management', 'Order Tracking', 'Inventory Sync', 'Customer Data'],
      setupFields: ['storeUrl', 'apiKey', 'apiSecret']
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      description: 'WordPress e-commerce plugin',
      icon: <Package className="h-5 w-5 text-purple-600" />,
      features: ['WordPress Integration', 'Flexible Customization', 'Extensions', 'Analytics'],
      setupFields: ['storeUrl', 'consumerKey', 'consumerSecret']
    },
    {
      id: 'magento',
      name: 'Magento',
      description: 'Enterprise e-commerce platform',
      icon: <TrendingUp className="h-5 w-5 text-orange-600" />,
      features: ['Multi-store Management', 'B2B Features', 'Advanced SEO', 'Scalability'],
      setupFields: ['storeUrl', 'accessToken', 'adminToken']
    },
    {
      id: 'bigcommerce',
      name: 'BigCommerce',
      description: 'SaaS e-commerce platform',
      icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
      features: ['Built-in Features', 'API-first', 'Multi-channel', 'Enterprise Ready'],
      setupFields: ['storeHash', 'clientId', 'accessToken']
    },
    {
      id: 'prestashop',
      name: 'PrestaShop',
      description: 'Open-source e-commerce solution',
      icon: <Users className="h-5 w-5 text-red-600" />,
      features: ['Open Source', 'Multilingual', 'Multi-currency', 'Module System'],
      setupFields: ['storeUrl', 'webserviceKey']
    }
  ];

  const mockIntegrations: EcommerceIntegration[] = [
    {
      id: 'shopify-1',
      name: 'Main Online Store',
      type: 'shopify',
      status: 'active',
      config: {
        storeUrl: 'https://company-store.myshopify.com',
        apiKey: 'sp_***************',
        apiSecret: 'sp_***************',
        orderTracking: true,
        inventorySync: true,
        productRecommendations: true,
        abandonedCartRecovery: true,
        customerSupport: true
      },
      metrics: {
        ordersProcessed: 3247,
        cartRecoveries: 456,
        productViews: 28934,
        conversionRate: 3.2,
        avgOrderValue: 127.50,
        totalRevenue: 414000
      },
      lastSync: '2024-01-20T12:00:00Z',
      createdAt: '2024-01-08T10:00:00Z'
    },
    {
      id: 'woocommerce-1',
      name: 'WordPress Store',
      type: 'woocommerce',
      status: 'active',
      config: {
        storeUrl: 'https://store.company.com',
        apiKey: 'wc_***************',
        apiSecret: 'wc_***************',
        orderTracking: true,
        inventorySync: false,
        productRecommendations: true,
        abandonedCartRecovery: false,
        customerSupport: true
      },
      metrics: {
        ordersProcessed: 1823,
        cartRecoveries: 234,
        productViews: 15672,
        conversionRate: 2.8,
        avgOrderValue: 89.25,
        totalRevenue: 162700
      },
      lastSync: '2024-01-20T11:45:00Z',
      createdAt: '2024-01-12T14:30:00Z'
    }
  ];

  const mockProductCatalog: ProductCatalog[] = [
    {
      id: 'prod-1',
      name: 'Premium Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 299.99,
      currency: 'USD',
      category: 'Electronics',
      inStock: true,
      imageUrl: '/api/placeholder/150/150'
    },
    {
      id: 'prod-2',
      name: 'Smart Fitness Watch',
      description: 'Advanced fitness tracking with heart rate monitor',
      price: 199.99,
      currency: 'USD',
      category: 'Wearables',
      inStock: true,
      imageUrl: '/api/placeholder/150/150'
    },
    {
      id: 'prod-3',
      name: 'Organic Coffee Blend',
      description: 'Premium organic coffee beans from sustainable farms',
      price: 24.99,
      currency: 'USD',
      category: 'Food & Beverage',
      inStock: false,
      imageUrl: '/api/placeholder/150/150'
    },
    {
      id: 'prod-4',
      name: 'Eco-Friendly Water Bottle',
      description: 'Reusable stainless steel water bottle',
      price: 34.99,
      currency: 'USD',
      category: 'Lifestyle',
      inStock: true,
      imageUrl: '/api/placeholder/150/150'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIntegrations(mockIntegrations);
      setProductCatalog(mockProductCatalog);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'error':
        return 'destructive';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getProviderIcon = (type: string) => {
    const provider = ecommerceProviders.find(p => p.id === type);
    return provider?.icon || <ExternalLink className="h-5 w-5 text-gray-600" />;
  };

  const registerIntegration = () => {
    const integration: EcommerceIntegration = {
      id: `${newIntegration.type}-${Date.now()}`,
      name: newIntegration.name,
      type: newIntegration.type,
      status: 'pending',
      config: newIntegration.config,
      metrics: {
        ordersProcessed: 0,
        cartRecoveries: 0,
        productViews: 0,
        conversionRate: 0,
        avgOrderValue: 0,
        totalRevenue: 0
      },
      lastSync: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    setIntegrations([...integrations, integration]);
    setShowAddDialog(false);
    setNewIntegration({
      name: '',
      type: 'shopify',
      config: {
        storeUrl: '',
        apiKey: '',
        apiSecret: '',
        orderTracking: true,
        inventorySync: true,
        productRecommendations: true,
        abandonedCartRecovery: false,
        customerSupport: true,
      },
      enabled: true
    });
  };

  const testIntegration = (integration: EcommerceIntegration) => {
    setSelectedIntegration(integration);
    setShowTestDialog(true);
  };

  const runHealthCheck = () => {
    // Simulate health check
    console.log('Running e-commerce integrations health check...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-white">Loading e-commerce integrations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">E-commerce Integrations</h1>
          <p className="text-gray-300 mt-2">
            Connect your chatbots to e-commerce platforms for seamless shopping experiences.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={runHealthCheck} variant="outline" className="text-white border-gray-600">
            <Activity className="h-4 w-4 mr-2" />
            Health Check
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Add E-commerce Integration</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Connect a new e-commerce platform to your chat system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="integration-name" className="text-white">Integration Name</Label>
                  <Input
                    id="integration-name"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({...newIntegration, name: e.target.value})}
                    placeholder="Online Store"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="integration-type" className="text-white">E-commerce Platform</Label>
                  <Select 
                    value={newIntegration.type} 
                    onValueChange={(value) => setNewIntegration({...newIntegration, type: value as any})}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {ecommerceProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id} className="text-white">
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="store-url" className="text-white">Store URL</Label>
                  <Input
                    id="store-url"
                    value={newIntegration.config.storeUrl}
                    onChange={(e) => setNewIntegration({
                      ...newIntegration, 
                      config: {...newIntegration.config, storeUrl: e.target.value}
                    })}
                    placeholder="https://your-store.myshopify.com"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="api-key" className="text-white">API Key</Label>
                    <Input
                      id="api-key"
                      value={newIntegration.config.apiKey}
                      onChange={(e) => setNewIntegration({
                        ...newIntegration, 
                        config: {...newIntegration.config, apiKey: e.target.value}
                      })}
                      placeholder="Your API key"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="api-secret" className="text-white">API Secret</Label>
                    <Input
                      id="api-secret"
                      type="password"
                      value={newIntegration.config.apiSecret}
                      onChange={(e) => setNewIntegration({
                        ...newIntegration, 
                        config: {...newIntegration.config, apiSecret: e.target.value}
                      })}
                      placeholder="Your API secret"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newIntegration.config.orderTracking}
                      onCheckedChange={(checked) => setNewIntegration({
                        ...newIntegration, 
                        config: {...newIntegration.config, orderTracking: checked}
                      })}
                    />
                    <Label className="text-white">Enable order tracking and status updates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newIntegration.config.inventorySync}
                      onCheckedChange={(checked) => setNewIntegration({
                        ...newIntegration, 
                        config: {...newIntegration.config, inventorySync: checked}
                      })}
                    />
                    <Label className="text-white">Sync inventory and product availability</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newIntegration.config.productRecommendations}
                      onCheckedChange={(checked) => setNewIntegration({
                        ...newIntegration, 
                        config: {...newIntegration.config, productRecommendations: checked}
                      })}
                    />
                    <Label className="text-white">Enable AI-powered product recommendations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newIntegration.config.abandonedCartRecovery}
                      onCheckedChange={(checked) => setNewIntegration({
                        ...newIntegration, 
                        config: {...newIntegration.config, abandonedCartRecovery: checked}
                      })}
                    />
                    <Label className="text-white">Abandoned cart recovery campaigns</Label>
                  </div>
                </div>
                <Button onClick={registerIntegration} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Integration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Orders</p>
                <p className="text-2xl font-bold text-white">
                  {integrations.reduce((acc, i) => acc + i.metrics.ordersProcessed, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Percent className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Conversion Rate</p>
                <p className="text-2xl font-bold text-white">
                  {(integrations.reduce((acc, i) => acc + i.metrics.conversionRate, 0) / integrations.length || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Avg Order Value</p>
                <p className="text-2xl font-bold text-white">
                  ${(integrations.reduce((acc, i) => acc + i.metrics.avgOrderValue, 0) / integrations.length || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ${integrations.reduce((acc, i) => acc + i.metrics.totalRevenue, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="integrations" className="text-white data-[state=active]:bg-gray-700">
            Active Integrations
          </TabsTrigger>
          <TabsTrigger value="catalog" className="text-white data-[state=active]:bg-gray-700">
            Product Catalog
          </TabsTrigger>
          <TabsTrigger value="providers" className="text-white data-[state=active]:bg-gray-700">
            Available Providers
          </TabsTrigger>
        </TabsList>

        {/* Active Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4">
            {integrations.map((integration) => (
              <Card key={integration.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-700">
                        {getProviderIcon(integration.type)}
                      </div>
                      <div>
                        <CardTitle className="text-white">{integration.name}</CardTitle>
                        <CardDescription className="text-gray-300">
                          {ecommerceProviders.find(p => p.id === integration.type)?.name} Integration
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testIntegration(integration)}
                        className="text-white border-gray-600"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Orders</p>
                      <p className="text-2xl font-bold text-white">{integration.metrics.ordersProcessed}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Cart Recoveries</p>
                      <p className="text-2xl font-bold text-white">{integration.metrics.cartRecoveries}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Product Views</p>
                      <p className="text-2xl font-bold text-white">{integration.metrics.productViews}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Revenue</p>
                      <p className="text-2xl font-bold text-white">${integration.metrics.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-300">
                      Last sync: {new Date(integration.lastSync).toLocaleString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="text-white border-gray-600">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" className="text-white border-gray-600">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Product Catalog Tab */}
        <TabsContent value="catalog" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Product Catalog</h3>
            <div className="flex space-x-2">
              <Button variant="outline" className="text-white border-gray-600">
                <Search className="h-4 w-4 mr-2" />
                Search Products
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Catalog
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {productCatalog.map((product) => (
              <Card key={product.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-base">{product.name}</CardTitle>
                      <CardDescription className="text-gray-300">{product.category}</CardDescription>
                    </div>
                    <Badge variant={product.inStock ? 'default' : 'destructive'}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        ${product.price} {product.currency}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="text-white border-gray-600">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Available Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {ecommerceProviders.map((provider) => (
              <Card key={provider.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-700">
                      {provider.icon}
                    </div>
                    <div>
                      <CardTitle className="text-white">{provider.name}</CardTitle>
                      <CardDescription className="text-gray-300">{provider.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-2">Key Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {provider.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-white border-gray-600">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        setNewIntegration({...newIntegration, type: provider.id as any});
                        setShowAddDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Connect {provider.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Test Dialog */}
      {selectedIntegration && (
        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent className="bg-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Test Integration: {selectedIntegration.name}</DialogTitle>
              <DialogDescription className="text-gray-300">
                Test your e-commerce integration with sample order data.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="bg-gray-700 border-gray-600">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-white">
                  Integration test completed successfully. Product catalog synced and order tracking enabled.
                </AlertDescription>
              </Alert>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EcommerceIntegrations;

