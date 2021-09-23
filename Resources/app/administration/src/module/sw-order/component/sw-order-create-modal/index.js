import template from './sw-order-create-modal.html.twig';
import './sw-order-create-modal.scss';

const { Component, State, Service, Utils } = Shopware;
const { mapState } = Component.getComponentHelper();

Component.register('sw-order-create-modal', {
    template,

    data() {
        return {
            productItems: [],
            isLoading: false,
        };
    },

    computed: {
        lineItemTypes() {
            return Service('cartStoreService').getLineItemTypes();
        },

        lineItemPriceTypes() {
            return Service('cartStoreService').getLineItemPriceTypes();
        },

        orderLineItemRepository() {
            return Service('repositoryFactory').create('order_line_item');
        },

        taxStatus() {
            return Utils.get(this.cart, 'price.taxStatus', '');
        },

        ...mapState('swOrder', ['customer', 'cart']),
    },

    methods: {
        onCloseModal() {
            if (this.customer === null || this.cart === null) {
                this.$emit('modal-close');
                return;
            }

            State.dispatch('swOrder/cancelCart', {
                salesChannelId: this.customer.salesChannelId,
                contextToken: this.cart.token,
            }).then(() => {
                this.$emit('modal-close');
            });
        },

        async onPreviewOrder() {
            // Get product line items
            const items = this.productItems.map(product => this.addExistingProduct(product));

            // TODO: items concat custom item and credit
            this.isLoading = true;

            try {
                const response = await this.onSaveItem(items);
                State.commit('swOrder/setCart', response.data);
                this.$emit('order-preview');
            } catch (error) {
                console.log(error);
            } finally {
                this.isLoading = false;
            }
        },

        onSaveItem(items) {
            return Service('cartStoreService')
                .addMultipleLineItems(this.customer.salesChannelId, this.cart.token, items);
        },

        createNewOrderLineItem() {
            const item = this.orderLineItemRepository.create();
            item.versionId = Shopware.Context.api.liveVersionId;
            this.initLineItem(item);

            return item;
        },

        initLineItem(item) {
            item.priceDefinition = {
                isCalculated: true,
                taxRules: [{ taxRate: 0, percentage: 100 }],
                price: 0,
            };
            item.price = {
                taxRules: [{ taxRate: 0 }],
                unitPrice: 0,
                quantity: 1,
                totalPrice: 0,
            };
            item.quantity = 1;
            item.unitPrice = 0;
            item.totalPrice = 0;
            item.precision = 2;
            item.label = '';
        },

        addExistingProduct(product) {
            const item = this.createNewOrderLineItem();
            item.type = this.lineItemTypes.PRODUCT;
            item.identifier = product.id;
            item.label = product.name;
            item.priceDefinition.price = this.taxStatus === 'gross'
                ? product.price[0].gross
                : product.price[0].net;
            item.priceDefinition.type = this.lineItemPriceTypes.QUANTITY;
            item.price.taxRules[0].taxRate = product.tax.taxRate;
            item.quantity = product.amount;
            item.priceDefinition.taxRules[0].taxRate = product.tax.taxRate;

            return item;
        },

        addCustomItem(customItem) {
            const item = this.createNewOrderLineItem();
            item.description = 'custom line item';
            item.type = this.lineItemTypes.CUSTOM;
            item.priceDefinition.type = this.lineItemPriceTypes.QUANTITY;
            item.priceDefinition.taxRules[0].taxRate = customItem.tax.taxRate;
            item.priceDefinition.quantity = customItem.quantity;
        },

        addCreditItem(credit) {
            const item = this.createNewOrderLineItem();
            item.description = 'credit line item';
            item.type = this.lineItemTypes.CREDIT;
            item.priceDefinition.type = this.lineItemPriceTypes.ABSOLUTE;
            item.priceDefinition.taxRules[0].taxRate = credit.tax.taxRate;
            item.priceDefinition.quantity = 1;
        },

        onProductChange(products) {
            this.productItems = products.filter(item => item.amount > 0);
        },
    },
});
