import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ShoppingBag, Filter } from 'lucide-react-native';

import colors from '@/constants/colors';
import { useMarketplaceProducts, useCategories } from '@/hooks/useApi';
import type { Product } from '@/types';

function ProductCard({ product }: { product: Product }) {
  const productImage = product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <TouchableOpacity style={styles.productCard}>
      {productImage ? (
        <Image source={{ uri: productImage }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder]}>
          <ShoppingBag color={colors.dark.textSecondary} size={40} />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.productPrice}>
          {product.currency} {product.price.toFixed(2)}
        </Text>
        <View style={styles.productMeta}>
          <Text style={styles.productSeller}>by {product.seller.username}</Text>
          {product.approval_status === 'pending' && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          )}
          {product.approval_status === 'approved' && (
            <View style={styles.approvedBadge}>
              <Text style={styles.approvedText}>Approved</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MarketplaceScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  
  const { data: productsData, isLoading: productsLoading } = useMarketplaceProducts(1, selectedCategory);
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories('product');

  const products = productsData?.data || [];
  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  console.log('[Marketplace] Products:', products.length, 'Categories:', categories.length);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <TouchableOpacity>
          <Filter color={colors.dark.text} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search color={colors.dark.textSecondary} size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={colors.dark.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {!categoriesLoading && categories.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categories}
        >
          <TouchableOpacity 
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(undefined)}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.id}
              style={[
                styles.categoryChip, 
                selectedCategory === category.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {productsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.dark.text} />
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ShoppingBag color={colors.dark.textSecondary} size={60} />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>Check back later for new listings</Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.dark.text,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.card,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.dark.text,
  },
  categoriesContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  categories: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.dark.card,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  categoryChipActive: {
    backgroundColor: colors.dark.accent,
    borderColor: colors.dark.accent,
  },
  categoryText: {
    fontSize: 14,
    color: colors.dark.text,
    fontWeight: '500' as const,
  },
  categoryTextActive: {
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  productImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.dark.surface,
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.dark.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.dark.accent,
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productSeller: {
    fontSize: 13,
    color: colors.dark.textSecondary,
  },
  pendingBadge: {
    backgroundColor: colors.dark.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 11,
    color: colors.dark.warning,
    fontWeight: '600' as const,
  },
  approvedBadge: {
    backgroundColor: colors.dark.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  approvedText: {
    fontSize: 11,
    color: colors.dark.success,
    fontWeight: '600' as const,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.dark.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    marginTop: 8,
  },
});
