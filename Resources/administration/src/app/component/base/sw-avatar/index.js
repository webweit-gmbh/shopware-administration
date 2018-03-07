import { Component } from 'src/core/shopware';
import './sw-avatar.less';
import template from './sw-avatar.html.twig';

Component.register('sw-avatar', {
    template,

    props: {
        image: {
            type: String,
            required: false,
            default: ''
        },
        size: {
            type: String,
            required: false
        }
    },

    computed: {
        avatarSize() {
            const size = this.size;

            return {
                width: size,
                height: size
            };
        },

        avatarImage() {
            return {
                'background-image': `url(${this.image})`
            };
        }
    }
});
