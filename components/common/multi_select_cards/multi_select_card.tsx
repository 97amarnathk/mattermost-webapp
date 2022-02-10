// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {FormattedMessage} from 'react-intl';

import Constants from 'utils/constants';

import './multi_select_card.scss';

export type Props = {
    onClick: () => void;
    icon: JSX.Element;
    id: string;
    defaultMessage: string;
    checked: boolean;
    tooltip?: string;
    size?: 'regular' | 'small';
}
const MultiSelectCard = (props: Props) => {
    const buttonProps: {
        className: string;
        onClick: () => void;
        tooltip?: string;
    } = {
        className: 'MultiSelectCard',
        onClick: props.onClick,
    };
    if (props.tooltip) {
        buttonProps.tooltip = props.tooltip;
    }
    if (props.checked) {
        buttonProps.className += ' MultiSelectCard--checked';
    }
    if (props.size === 'small') {
        buttonProps.className += ' MultiSelectCard--small';
    }

    return (
        <button
            {...buttonProps}
            onKeyUp={(e: React.KeyboardEvent) => {
                if (e.key !== Constants.KeyCodes.SPACE[0]) {
                    return;
                }

                props.onClick();
            }}
        >
            {props.checked && <i className='MultiSelectCard__checkmark icon icon-check-circle'/>}
            {props.icon}
            <span className='MultiSelectCard__label'>
                <FormattedMessage
                    id={props.id}
                    defaultMessage={props.defaultMessage}
                />
            </span>
        </button>
    );
};

export default MultiSelectCard;
