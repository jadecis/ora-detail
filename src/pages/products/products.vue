
<template>
	<section class="products-page">
		<div class="products-loading" v-if="loading">Загрузка товаров...</div>
		<div class="products-grid" v-else>
			<article v-for="p in products" :key="p.id" class="product-card">
				<div class="product-image">
					<img :src="firstImage(p.folder)" :alt="p.title" />
				</div>
				<div class="product-info">
					<h3>{{ p.title }}</h3>
					<p class="product-category">{{ p.category }}</p>
					<p class="product-price"><img class="price-icon" src="/src/assets/icons/кошелек.png" alt="">{{ p.price }}</p>
					<button class="btn-cart"><img src="/src/assets/icons/корзина.png" alt=""> В корзину</button>
				</div>
			</article>
		</div>
	</section>
</template>

<script>
export default {
	name: 'ProductsPage',
	data() { return { products: [], loading: true, imagesByFolder: {} } },
	async created() {
		await this.loadAssets();
		await this.loadProducts();
	},
	methods: {
		async loadAssets() {
			const modules = import.meta.glob('../../assets/images/products/*/*.{jpg,png,webp}', { eager: true, as: 'url' });
			for (const path in modules) {
				const url = modules[path];
				const m = path.match(/products\/(.+?)\//);
				if (m) {
					const folder = m[1];
					this.imagesByFolder[folder] = this.imagesByFolder[folder] || [];
					this.imagesByFolder[folder].push(url);
				}
			}
			Object.keys(this.imagesByFolder).forEach(k => this.imagesByFolder[k].sort());
		},
		async loadProducts() {
			try {
				const res = await fetch(new URL('../../products.json', import.meta.url));
				if (!res.ok) throw new Error('Failed to load');
				this.products = await res.json();
			} catch (e) { console.error(e) } finally { this.loading = false }
		},
		firstImage(folder) {
			const imgs = this.imagesByFolder[folder];
			if (imgs && imgs.length) return imgs[0];
			return `/src/assets/images/products/${folder}/1.jpg`;
		}
	}
}
</script>

<style scoped>
.products-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;padding:20px}
.product-card{border:1px solid #eaeaea;padding:12px;border-radius:6px;background:#fff}
.product-image img{width:100%;height:160px;object-fit:cover}
.product-info{padding-top:8px}
.product-price{font-weight:600}
</style>

