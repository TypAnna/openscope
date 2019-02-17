import $ from 'jquery';
import _forEach from 'lodash/forEach';
import _isNaN from 'lodash/isNaN';
import GameController from '../game/GameController';
import { SELECTORS } from '../constants/selectors';

/**
 * @property UI_SETTINGS_MODAL_TEMPLATE
 * @type {string}
 * @final
 */
const UI_SETTINGS_MODAL_TEMPLATE = `
    <div class="option-dialog dialog">
        <p class="dialog-title">Options</p>
        <div class="dialog-body nice-scrollbar"></div>
    </div>`;

/**
 * @property UI_OPTION_CONTAINER_TEMPLATE
 * @type {string}
 * @final
 */
const UI_OPTION_CONTAINER_TEMPLATE = '<div class="form-element"></div>';

/**
 * @property UI_OPTION_SELECTOR_TEMPLATE
 * @type {string}
 * @final
 */
const UI_OPTION_SELECTOR_TEMPLATE = '<span class="form-type-select"></span>';

/**
 * @class SettingsController
 */
export default class SettingsController {

    constructor($element) {
        /**
         * Root DOM element
         *
         * @property $element
         * @type {jquery|HTML Element}
         * @default $element
         */
        this.$element = $element;

        /**
         * Dialog DOM element
         *
         * @property $dialog
         * @type {jquery|HTML Element}
         * @default null
         */
        this.$dialog = null;

        /**
         * Dialog's body DOM element
         *
         * @property $dialogBody
         * @type {jquery|HTML Element}
         * @default null
         */
        this.$dialogBody = null;

        this.init();
    }

    /**
     *
     * @for SettingsController
     * @method init
     * @chainable
     */
    init() {
        this.$dialog = $(UI_SETTINGS_MODAL_TEMPLATE);
        this.$dialogBody = this.$dialog.find(`.${SELECTORS.DIALOG_BODY}`);
        const descriptions = GameController.game.option.getDescriptions();

        _forEach(descriptions, (opt) => {
            if (opt.type !== 'select') {
                return;
            }

            const $container = this._buildOptionTemplate(opt);
            this.$dialogBody.append($container);
        });

        this.$element.append(this.$dialog);

        return this;
    }

    /**
     * Returns whether the airport selection dialog is open
     *
     * @for SettingsController
     * @method isDialogOpen
     * @return {boolean}
     */
    isDialogOpen() {
        return this.$dialog.hasClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
    * @for SettingsController
    * @method toggleDialog
    */
    toggleDialog() {
        this.$dialog.toggleClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
     * Build the html for a game option and its corresponding value elements.
     *
     * @for SettingsController
     * @method _buildOptionTemplate
     * @param option {object}
     * @return $container {jquery Element}
     * @private
     */
    _buildOptionTemplate(option) {
        const $container = $(UI_OPTION_CONTAINER_TEMPLATE);
        $container.append(`<span class="form-label">${option.description}</span>`);

        const $optionSelector = $(UI_OPTION_SELECTOR_TEMPLATE);
        const $selector = $(`<select name="${option.name}"></select>`);
        const selectedOption = GameController.game.option.getOptionByName(option.name);

        for (let i = 0; i < option.optionList.length; i++) {
            const $optionSelectTempalate = this._buildOptionSelectTemplate(option.optionList[i], selectedOption);

            $selector.append($optionSelectTempalate);
        }

        // TODO: this should be moved to proper event handler method and only assigned here.
        $selector.change((event) => {
            const $currentTarget = $(event.currentTarget);

            GameController.game.option.setOptionByName($currentTarget.attr('name'), $currentTarget.val());
        });

        $optionSelector.append($selector);
        $container.append($optionSelector);

        return $container;
    }

    /**
     * Build the html for a select option.
     *
     * @for SettingsController
     * @method _buildOptionTemplate
     * @param optionData {array<string>}
     * @param selectedOption {string}
     * @return optionSelectTempalate {HTML Element}
     * @private
     */
    _buildOptionSelectTemplate(optionData, selectedOption) {
        // the `selectedOption` coming in to this method will always be a string (due to existing api) but
        // could contain valid numbers. here we test for valid number and build `parsedSelectedOption` accordingly.
        const parsedSelectedOption = !_isNaN(parseFloat(selectedOption))
            ? parseFloat(selectedOption)
            : selectedOption;

        if (optionData.value === parsedSelectedOption) {
            return `<option value="${optionData.value}" selected>${optionData.displayLabel}</option>`;
        }

        return `<option value="${optionData.value}">${optionData.displayLabel}</option>`;
    }
}
