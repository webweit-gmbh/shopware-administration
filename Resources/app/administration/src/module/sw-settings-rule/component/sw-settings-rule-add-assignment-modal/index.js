import EntityCollection from 'src/core/data/entity-collection.data';
import template from './sw-settings-rule-add-assignment-modal.html.twig';
import './sw-settings-rule-assignment-modal.scss';

const { Component, Context } = Shopware;

Component.register('sw-settings-rule-add-assignment-modal', {
    template,

    inject: [
        'repositoryFactory',
    ],

    props: {
        rule: {
            type: Object,
            required: true,
        },
        entityContext: {
            type: Object,
            required: true,
        },
    },

    data() {
        return {
            repository: null,
            entities: null,
            isLoading: true,
            selection: {},
            criteriaLimit: 10,
            currentLanguageId: Shopware.Context.api.languageId,
        };
    },

    computed: {
        modalSize() {
            return this.entityContext.entityName === 'category' ? 'default' : 'full';
        },
    },

    created() {
        this.createdComponent();
    },

    methods: {
        createdComponent() {
            if (this.entityContext.entityName === 'category') {
                this.entities = new EntityCollection('/category', 'category', Context.api);
            } else {
                this.repository = this.entityContext.repository;
                this.loadEntities();
            }
        },

        loadEntities() {
            const api = this.entityContext.api ? this.entityContext.api() : Context.api;
            const criteria = this.entityContext.addContext.criteria();
            criteria.setLimit(10);

            this.repository.search(criteria, api).then((result) => {
                this.entities = result;
                this.isLoading = false;
            });
        },

        onCloseAddModal() {
            this.$emit('close-add-modal');
        },

        onAdd() {
            if (this.entityContext.addContext.type === 'update') {
                this.updateEntities();
                return;
            }

            this.insertEntities();
        },

        updateEntities() {
            const api = this.entityContext.api ? this.entityContext.api() : Context.api;
            const repository = this.repositoryFactory.create(this.entityContext.addContext.entity);

            Object.values(this.selection).forEach(item => {
                item[this.entityContext.addContext.column] = this.rule.id;
            });

            repository.sync(Object.values(this.selection), api).then(() => this.$emit('entities-saved'));
        },

        insertEntities() {
            const api = this.entityContext.api ? this.entityContext.api() : Context.api;
            const repository = this.repositoryFactory.create(this.entityContext.addContext.entity);

            const inserts = [];
            Object.values(this.selection).forEach(item => {
                const entity = repository.create(api);
                entity.ruleId = this.rule.id;
                entity[this.entityContext.addContext.column] = item.id;
                inserts.push(entity);
            });

            repository.sync(inserts, api).then(() => this.$emit('entities-saved'));
        },

        onSelect(selection) {
            this.selection = selection;
        },
    },
});
