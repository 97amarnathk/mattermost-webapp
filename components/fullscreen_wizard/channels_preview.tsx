// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {CSSTransition} from 'react-transition-group';
import {Animations, AnimationReason, mapAnimationReasonToClass, WizardStep, WizardSteps} from './steps'

import ChannelsPreviewSVG from './channels-preview.svg';
import TeamMembers from './team_members';

import './channels_preview.scss'

type Props = {
    channelName: string;
    teamName: string;
    show: boolean;
    step: WizardStep;
    direction: AnimationReason;
}

const ChannelsPreview = (props: Props) => {
    // TODO: Need to edit The SVG some so that the text appears in the SVG

    return (
        <CSSTransition
            in={props.show}
            timeout={Animations.PAGE_SLIDE}
            classNames={mapAnimationReasonToClass('ChannelsPreview', props.direction)}
            mountOnEnter={true}
            unmountOnExit={true}
        >
            <div className='ChannelsPreview-body'>
                {props.channelName}
                {props.teamName}
                <ChannelsPreviewSVG/>
                <TeamMembers
                    show={props.step === WizardSteps.InviteMembers}
                    direction={(() => {
                        if (props.step === WizardSteps.Channel) {
                            return Animations.Reasons.ExitToBefore;
                        } else if (props.step === WizardSteps.InviteMembers) {
                            return Animations.Reasons.EnterFromBefore;
                        }
                        return Animations.Reasons.EnterFromBefore;
                    })()}
                />
            </div>
        </CSSTransition>
    );
};

export default ChannelsPreview
