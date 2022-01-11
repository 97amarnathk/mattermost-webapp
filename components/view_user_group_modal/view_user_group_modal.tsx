// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {createRef, RefObject} from 'react';

import {Modal} from 'react-bootstrap';

import {FormattedMessage} from 'react-intl';

import {UserProfile} from 'mattermost-redux/types/users';

import Constants, {ModalIdentifiers} from 'utils/constants';

import FaSearchIcon from 'components/widgets/icons/fa_search_icon';
import Avatar from 'components/widgets/users/avatar';
import * as Utils from 'utils/utils.jsx';
import LoadingScreen from 'components/loading_screen';
import {Group} from 'mattermost-redux/types/groups';

import './view_user_group_modal.scss';
import MenuWrapper from 'components/widgets/menu/menu_wrapper';
import Menu from 'components/widgets/menu/menu';
import {ModalData} from 'types/actions';
import AddUsersToGroupModal from 'components/add_users_to_group_modal';
import {debounce} from 'mattermost-redux/actions/helpers';

import LocalizedIcon from 'components/localized_icon';
import {t} from 'utils/i18n';
import UpdateUserGroupModal from 'components/update_user_group_modal';
import {ActionResult} from 'mattermost-redux/types/actions';
import Input from 'components/input';

const USERS_PER_PAGE = 60;

export type Props = {
    onExited: () => void;
    searchTerm: string;
    groupId: string;
    group: Group;
    users: UserProfile[];
    backButtonCallback: () => void;
    backButtonAction: () => void;
    currentUserId: string;
    permissionToEditGroup: boolean;
    permissionToJoinGroup: boolean;
    permissionToLeaveGroup: boolean;
    permissionToArchiveGroup: boolean;
    actions: {
        getGroup: (groupId: string, includeMemberCount: boolean) => Promise<{data: Group}>;
        getUsersInGroup: (groupId: string, page: number, perPage: number) => Promise<{data: UserProfile[]}>;
        setModalSearchTerm: (term: string) => void;
        openModal: <P>(modalData: ModalData<P>) => void;
        searchProfiles: (term: string, options: any) => Promise<ActionResult>;
        removeUsersFromGroup: (groupId: string, userIds: string[]) => Promise<ActionResult>;
        addUsersToGroup: (groupId: string, userIds: string[]) => Promise<ActionResult>;
        archiveGroup: (groupId: string) => Promise<ActionResult>;
    };
}

type State = {
    page: number;
    loading: boolean;
    show: boolean;
    selectedFilter: string;
    memberCount: number;
}

export default class ViewUserGroupModal extends React.PureComponent<Props, State> {
    private divScrollRef: RefObject<HTMLDivElement>;
    private searchTimeoutId: number

    constructor(props: Props) {
        super(props);

        this.divScrollRef = createRef();
        this.searchTimeoutId = 0;

        this.state = {
            page: 0,
            loading: true,
            show: true,
            selectedFilter: 'all',
            memberCount: props.group.member_count,
        };
    }

    incrementMemberCount = () => {
        this.setState({memberCount: this.state.memberCount + 1});
    }

    decrementMemberCount = () => {
        this.setState({memberCount: this.state.memberCount - 1});
    }

    doHide = () => {
        this.setState({show: false});
    }

    async componentDidMount() {
        const {
            groupId,
            actions,
        } = this.props;

        await Promise.all([
            actions.getGroup(groupId, true),
            actions.getUsersInGroup(groupId, 0, USERS_PER_PAGE),
        ]);
        this.loadComplete();
    }

    componentWillUnmount() {
        this.props.actions.setModalSearchTerm('');
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.searchTerm !== this.props.searchTerm) {
            clearTimeout(this.searchTimeoutId);
            const searchTerm = this.props.searchTerm;

            if (searchTerm === '') {
                this.loadComplete();
                this.searchTimeoutId = 0;
                return;
            }

            const searchTimeoutId = window.setTimeout(
                async () => {
                    await prevProps.actions.searchProfiles(searchTerm, {in_group_id: this.props.groupId});
                },
                Constants.SEARCH_TIMEOUT_MILLISECONDS,
            );

            this.searchTimeoutId = searchTimeoutId;
        }
    }

    startLoad = () => {
        this.setState({loading: true});
    }

    loadComplete = () => {
        this.setState({loading: false});
    }

    handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        this.props.actions.setModalSearchTerm(term);
    }

    resetSearch = () => {
        this.props.actions.setModalSearchTerm('');
    };

    goToAddPeopleModal = () => {
        const {actions, groupId} = this.props;

        actions.openModal({
            modalId: ModalIdentifiers.ADD_USERS_TO_GROUP,
            dialogType: AddUsersToGroupModal,
            dialogProps: {
                groupId,
                backButtonCallback: this.props.backButtonAction,
            },
        });

        this.props.onExited();
    }

    goToEditGroupModal = () => {
        const {actions, groupId} = this.props;

        actions.openModal({
            modalId: ModalIdentifiers.EDIT_GROUP_MODAL,
            dialogType: UpdateUserGroupModal,
            dialogProps: {
                groupId,
                backButtonCallback: this.props.backButtonAction,
            },
        });

        this.props.onExited();
    }

    getGroupMembers = debounce(
        async () => {
            const {actions, groupId} = this.props;
            const {page} = this.state;
            const newPage = page + 1;

            this.setState({page: newPage});

            this.startLoad();
            await actions.getUsersInGroup(groupId, newPage, USERS_PER_PAGE);
            this.loadComplete();
        },
        200,
        false,
        (): void => {},
    );

    onScroll = () => {
        const scrollHeight = this.divScrollRef.current?.scrollHeight || 0;
        const scrollTop = this.divScrollRef.current?.scrollTop || 0;
        const clientHeight = this.divScrollRef.current?.clientHeight || 0;

        if ((scrollTop + clientHeight + 30) >= scrollHeight) {
            if (this.props.users.length !== this.props.group.member_count && this.state.loading === false) {
                this.getGroupMembers();
            }
        }
    }

    removeUserFromGroup = async (userId: string) => {
        const {groupId, actions} = this.props;

        await actions.removeUsersFromGroup(groupId, [userId]).then(() => {
            this.decrementMemberCount();
        });
    }

    leaveGroup = async (groupId: string) => {
        const {currentUserId, actions} = this.props;

        // Should do some redux thing where I decrement the member_count of the group

        await actions.removeUsersFromGroup(groupId, [currentUserId]).then(() => {
            this.decrementMemberCount();
        });
    }

    joinGroup = async (groupId: string) => {
        const {currentUserId, actions} = this.props;

        // Should do some redux thing where I increment the member_count of the group

        await actions.addUsersToGroup(groupId, [currentUserId]).then(() => {
            this.incrementMemberCount();
        });
    }

    archiveGroup = async (groupId: string) => {
        const {actions} = this.props;

        await actions.archiveGroup(groupId);
    }

    render() {
        const {group, users} = this.props;

        return (
            <Modal
                dialogClassName='a11y__modal view-user-groups-modal'
                show={this.state.show}
                onHide={this.doHide}
                onExited={this.props.onExited}
                role='dialog'
                aria-labelledby='viewUserGroupModalLabel'
            >
                <Modal.Header closeButton={true}>
                    <button
                        type='button'
                        className='modal-header-back-button btn-icon'
                        aria-label='Close'
                        onClick={() => {
                            this.props.backButtonCallback();
                            this.props.onExited();
                        }}
                    >
                        <LocalizedIcon
                            className='icon icon-arrow-left'
                            ariaLabel={{id: t('user_groups_modal.goBackLabel'), defaultMessage: 'Back'}}
                        />
                    </button>
                    <Modal.Title
                        componentClass='h1'
                        id='userGroupsModalLabel'
                    >
                        {group.display_name}
                    </Modal.Title>
                    {
                        group.source.toLowerCase() !== 'ldap' &&
                        <button
                            className='user-groups-create btn btn-md btn-primary'
                            onClick={this.goToAddPeopleModal}
                        >
                            <FormattedMessage
                                id='user_groups_modal.addPeople'
                                defaultMessage='AddPeople'
                            />
                        </button>
                    }
                    {
                        group.source.toLowerCase() !== 'ldap' &&
                        <div className='details-action'>
                            <MenuWrapper
                                isDisabled={false}
                                stopPropagationOnToggle={false}
                                id={`detailsCustomWrapper-${group.id}`}
                            >
                                <button className='action-wrapper btn-icon'>
                                    <LocalizedIcon
                                        className='icon icon-dots-vertical'
                                        ariaLabel={{id: t('user_groups_modal.goBackLabel'), defaultMessage: 'Back'}}
                                    />
                                </button>
                                <Menu
                                    openLeft={false}
                                    openUp={false}
                                    ariaLabel={Utils.localizeMessage('admin.user_item.menuAriaLabel', 'User Actions Menu')}
                                >
                                    <Menu.ItemAction
                                        show={this.props.permissionToEditGroup}
                                        onClick={() => {
                                            this.goToEditGroupModal();
                                        }}
                                        text={Utils.localizeMessage('user_groups_modal.editDetails', 'Edit Details')}
                                        disabled={false}
                                    />
                                    <Menu.ItemAction
                                        show={this.props.permissionToJoinGroup}
                                        onClick={() => {
                                            this.joinGroup(group.id);
                                        }}
                                        text={Utils.localizeMessage('user_groups_modal.joinGroup', 'Join Group')}
                                        disabled={false}
                                    />
                                    <Menu.ItemAction
                                        show={this.props.permissionToLeaveGroup}
                                        onClick={() => {
                                            this.leaveGroup(group.id);
                                        }}
                                        text={Utils.localizeMessage('user_groups_modal.leaveGroup', 'Leave Group')}
                                        disabled={false}
                                        isDangerous={true}
                                    />
                                    <Menu.ItemAction
                                        show={this.props.permissionToArchiveGroup}
                                        onClick={() => {
                                            this.archiveGroup(group.id);
                                        }}
                                        text={Utils.localizeMessage('user_groups_modal.archiveGroup', 'Archive Group')}
                                        disabled={false}
                                        isDangerous={true}
                                    />
                                </Menu>
                            </MenuWrapper>
                        </div>
                    }
                </Modal.Header>
                <Modal.Body>
                    <div className='group-mention-name'>
                        <span className='group-name'>{`@${group.name}`}</span>
                        {
                            group.source.toLowerCase() === 'ldap' &&
                            <span className='group-source'>
                                <FormattedMessage
                                    id='view_user_group_modal.ldapSynced'
                                    defaultMessage='AD/LDAP SYNCED'
                                />
                            </span>
                        }
                    </div>
                    <div className='user-groups-search'>
                        <FaSearchIcon/>
                        <Input
                            type='text'
                            placeholder={Utils.localizeMessage('search_bar.searchGroupMembers', 'Search group members')}
                            onChange={this.handleSearch}
                            value={this.props.searchTerm}
                            data-testid='searchInput'
                            className={'user-group-search-input'}
                        />
                    </div>
                    <div
                        className='user-groups-modal__content group-member-list'
                        onScroll={this.onScroll}
                        ref={this.divScrollRef}
                    >
                        <h2 className='group-member-count'>
                            <FormattedMessage
                                id='view_user_group_modal.memberCount'
                                defaultMessage='{member_count} {member_count, plural, one {Member} other {Members}}'
                                values={{
                                    member_count: this.state.memberCount,
                                }}
                            />
                        </h2>
                        {users.map((user) => {
                            return (
                                <div
                                    key={user.id}
                                    className='group-member-row'
                                >
                                    <>
                                        <Avatar
                                            username={user.username}
                                            size={'sm'}
                                            url={Utils.imageURLForUser(user?.id ?? '')}
                                            className={'avatar-post-preview'}
                                        />
                                    </>
                                    <div className='group-member-name'>
                                        {Utils.getFullName(user)}
                                    </div>
                                    <div className='group-member-username'>
                                        {`@${user.username}`}
                                    </div>
                                    {
                                        group.source.toLowerCase() !== 'ldap' &&
                                        <button
                                            type='button'
                                            className='remove-group-member btn-icon'
                                            aria-label='Close'
                                            onClick={() => {
                                                this.removeUserFromGroup(user.id);
                                            }}
                                        >
                                            <LocalizedIcon
                                                className='icon icon-trash-can-outline'
                                                ariaLabel={{id: t('user_groups_modal.goBackLabel'), defaultMessage: 'Back'}}
                                            />
                                        </button>
                                    }
                                </div>
                            );
                        })}
                        {
                            this.state.loading &&
                            <LoadingScreen/>
                        }
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}
