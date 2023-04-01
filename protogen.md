## Thread: struct
A collection of Posts that can be displayed
as a space, session, chat or any other view
that represents a time series of events
and content.

- id:string
- uv: number
- name:string
- abvName: string
  - abbreviated 1 or 2 chars
- description: string
- memberRequests: ThreadMemberRequest[]
- logEvents: LogEvent[]
- members?: ThreadMember[]
- defaultView: ThreadView
  - $link: ThreadView
- status: ThreadStatus
  - $link: ThreadStatus
- lastPost?: PostSummary
  - $link: PostSummary
- posts: Post[]
- created: number 
- ownedLinks: ThreadLink[]
- targetedLinks: ThreadLink[]
- active: boolean
- startDate?: number 
- endDate?: number 
- timezone?: string
- startedAtDate?: number
- endedAtDate?: number 
- featuredPostId?: string :Post
- endingFeaturedPostId?:string :Post
- posterSource?: MediaSource
  - $link: MediaSource
- postCount: number
- scenes?: string[]
  - $link: LocalizationPack
- localeOverrides: StringMap
- twilioRoomName?:string
- twilioRoomSid?:string

*hidden*
- $layout: -76 56 300

## User: struct
- id:string
- uv: number
- logEvents: LogEvent
- cognitoId?: string
- name:string
- typeName?:string
  - student, teacher, creator etc
- created: number
- email?: string
- phone?: string
- links?: LinkInfo[]
  - $link: LinkInfo
- postApprovals: Post[]
  - $link: Post.approvedById
- posts: Post[]
  - $link: Post.ownerId
- threadMemberApprovals: ThreadMemberRequest[]
  - $link: ThreadMemberRequest.approvedById
- memberRequests: ThreadMemberRequest[]
  - $link: ThreadMemberRequest.userId
- threads: ThreadMember[] 
- profilePicture?: MediaSource

*hidden*
- $layout: 1364 166 300

## Post: struct
- id: string
- uv: number
- created: number 
- yearMonth: string
  - yyyy-mm
- name:string
- public: boolean
  - If true all users can view the post
- logEvents: LogEvent
- ownerId?: string :User
- approvedById?: string :User
- type:string :PostType
  - $link: PostType
- threadId?: string :Thread
  - $link: Thread.posts
- featuredBy: Thread[]
  - $link: Thread.featuredPostId
- featuredEndingBy: Thread[]
  - $link: Thread.endingFeaturedPostId
- responses: Post[]
- responseToId: string :Post
  - $link: Post.responses

### Questions
Some posts will have questions

- questionResponseCorrectness?:number
- questionType?: QuestionType
  - $link: QuestionType
- questionResponseOptionId?:string
- question?: string
- questionOptions?: QuestionOption[]

### Content
Content related properties

- bgColor?:string
- mediaType?: MediaType
  - $link: MediaType
- data?: string
- dataContentType?: string
- posterSource?: MediaSource
  - $link: MediaSource
- mediaSource?: MediaSource

### Other
- email: string
- emailSecond?: string
- firstEmail?: string
- secondEmailSecure?: string

*hidden*
- $layout: 1408 718 300

## PostType: union
- image
- video
- question
- answer
- document
- avStream
- text
- url

*hidden*
- $layout: 2011 695 300

## ApprovalStatus: union
- pending
- approved
  - (only-by-admin)
- denied

*hidden*
- $layout: -1246 121 300

## FileInfo: struct
Generated URLs should contain a 
cryptographically unique / secure 
value. URL unpredictability is 
used as a security mechanism.
- url: string
- contentType: string
- isDataUri?:boolean
- sizeBytes: number
- width?: number
- height?: number
- created?: number 
- bucket?: string
- bucketKey?: string
- createdByUserId?: string :User

*hidden*
- $layout: 676 1322 300

## QuestionType: union
- multiChoice
- text
- media
- survey

*hidden*
- $layout: 1994 970 300

## LogEvent: struct
- id:string
- type: LogEventType
  - $link: LogEventType
- content?: string
- created: number 
- yearMonth: string
  - yyyy-mm
- threadId?: string :Thread
  - $link: Thread.logEvents
- userId?: string :User
  - $link: User.logEvents
- postId?: string :Post

*hidden*
- $layout: 709 -223 300

## LogEventType: union
- viewPost
- createPost
- enterThread
- exitThread
- answerQuestion
- answerQuestionCorrect
- answerQuestionIncorrect

*hidden*
- $layout: 1453 -141

## ThreadStatus: union
- beforeOpen
- open
- closed

*hidden*
- $layout: -604 315 300

## ThreadView: union
- util
- space
- canvas
- chat

*hidden*
- $layout: -609 111 300

## ThreadLink: struct
- id:string
- uv:number
- ownerId:string :Thread
  - $link: Thread.ownedLinks
- targetId:string :Thread
  - $link: Thread.targetedLinks
- passRoles?: boolean
- passRolesFilter?: ThreadRole[]
  - $link: ThreadRole
- name?: string

*hidden*
- $layout: -565 804 300

## MediaSource: struct
- sm?:FileInfo
- md?:FileInfo
- lg?:FileInfo
- source?:FileInfo
- additional?:FileInfo[]
- blurPreview?:string

*hidden*
- $layout: 679 972 300

## MediaType: union
- image
- video
- audio

*hidden*
- $layout: 1907 1550 300

## QuestionOption: struct
  - $link: Post.questionOptions
- id:string
- text?: string
- media?: MediaSource
- correctness?: number

*hidden*
- $layout: 1981 1214 300

## ThreadMember: struct
A User's relation to a Thread
- id:string
- uv: number
- created: number
- requestId?: string :ThreadMemberRequest
- order?: number
- threadId: string :Thread
  - $link: Thread.members
- userId: string :User
  - $link: User.threads
- roles: ThreadRole[]
  - $link: ThreadRole
- typeName?:string
  - student, teacher, creator etc
  - src: user.typeName
  - sync
- name: string
  - src: user.name
  - sync
- profileImageUrl?:string
  - src: user.profilePicture.sm
  - sync
- isFeatured?:boolean

*hidden*
- $layout: 626 145 300

## ThreadRole: enum
- threadAdmin: 1
- manageRoles:2
- listMembers:3
- addMember:4
- removeMember:5
- listPosts:6
- viewPost:7
- addPost:8
- removePost:9
- editPost:10
- addPostImage:101
- addPostVideo:102
- addPostQuestion:103
- addPostAnswer:104
- addPostDocument:105
- addPostAvStream:106
- addPostText:107
- addPostUrl:108

*hidden*
- $layout: 46 1125 300

## ThreadMemberRequest: struct
- id:string
- uv: number
- created: number 
- userId: string :User
- approvedById?: string :User
- threadId: string :Thread
  - $link: Thread.memberRequests
- resultMemberId?: ThreadMember
  - $link: ThreadMember.requestId
- requestedRoles?: ThreadRole[]

*hidden*
- $layout: 823 -593 300

## LocalizationPack: struct
- id: string
- uv: number
- scene?: string
- locales?: string[]
  - en, en-us, mx, dk, etc
- map: StringMap

*hidden*
- $layout: -18 839 300

## LinkInfo: struct
- name: string
- icon: string
- url: string

*hidden*
- $layout: 2040 307

## PostSummary: struct
- title: string
- description: string
- thumbnailUrl?: string
- previewUrl?: string
- postId: string :Post

*hidden*
- $layout: -610 528 300

## ThreadPermission: struct
- uid: string :User
- tid: string :Thread
- roles: ThreadRole[]

*hidden*
- $layout: -976 -113 300

## SessionView: screen
- thread: Thread
- join
- leave
- audio
  - on or off
- video
  - on or off
- end
  - ends the call for all users
- invite
  - $link: SessionInviteModal
- shareScreen
- kickOut
- postsTab
  - $link: PostsTab
- chatTab
  - $link: ChatTab
- peopleTab
  - $link: SessionPeopleTab
- questionsTab
  - $link: QuestionTab
- layout
- settings

*hidden*
- $layout: -2250 -2202 300

## SessionPeopleTab: comp
- audio: switch
  enables or disables audio for
  all users without the host role
- video: switch
  enables or disables video for
  all users without the host role
- userList
  - $link: SessionUserListItem

*hidden*
- $layout: -1858 -1522 300

## ChatTab: comp
- messageList
  - $link: ChatTabItem
- sendMessage
- deleteMessage
  - (admin)
- openLink

*hidden*
- $layout: -1575 -1863 300

## CreatePostFn: fn
- input: CreatePostRequest
  - $link: CreatePostRequest
- output: Post

*hidden*
- $layout: -1147 -2315 300

## CreatePostRequest: struct
- post: Post

*hidden*
- $layout: -724 -2248 300

## PostsTab: comp
- create
  - $link: CreatePostFn
- postList
  - $link: PostItemView

*hidden*
- $layout: -1585 -2212 300

## SessionUserListItem: comp
- name: string
- role: options
  - host
  - user
  - viewOnly
- video: switch
- audio: switch
- kick: button
- addToCanvas

*hidden*
- $layout: -1453 -1338 300

## ChatTabItem
Either a text message or media 
item

*hidden*
- $layout: -1192 -1567 300

## PostItemView
Items posted to the session by
any user
- post: Post
  The post shown
- user
  The creator of the item
- description
  A short description of the item
- addToCanvas
  Adds the item to the layout
  with focus

*hidden*
- $layout: -992 -1990 300

## SessionInviteModal: comp
- title
- url

*hidden*
- $layout: -2957 -2140 300

## QuestionTab: comp
- listView
  - $link: QuestionTabItem
- newQuestion: string
- createQuestion: button

*hidden*
- $layout: -2807 -1850 300

## QuestionTabItem

*hidden*
- $layout: -3334 -1669 300

## SpaceScreen: screen
- input: string
  Thread id
- model: SpaceModel
  - src: GetSpaceModel({threaId:input})
  - $link: GetSpaceModelFn
  - $link: SpaceModel

- hero
  - $link: SpaceHero
  
- homeTab
  - $link: SpaceHomeTab
  
- timelineTab
  - $link: TimelineTab

- peopleTab
  - $link: PeopleTab
  
- documentTab

*hidden*
- $layout: -5145 -209 300

## SpaceHomeTab: comp
- model: SpaceModel

- featuredMember: ThreadMember
  - src: model.featuredMember
  In most cases the teacher that owns the space
  
- shortMemberList
  - src: model.members.take(N)
  The first few members of the members of the
  space with a link to all members
  
- createNewSession: button
  - $link: CreateSessionModal
  
- addAllToCalendar: button
  Adds all upcoming sessions to a users calendar.
  (!) this may be problematic with how we are
  adding events to the user's calendar
  
- upcomingSessionsList
  - src: model.upcomingSessions
  - $link: SessionCard
  List of all up coming sessions

*hidden*
- $layout: -4597 346 300

## SpaceHero
- model: SpaceModel

- title
  - src: model.thread.name
  Title for the space. This title
  is persistent and does not change
  depending on the current session

- nextSession: Thread
  - src: model.nextSession
  - date
  - title
  - description
  - join: button
  - files
  - peopleList

*hidden*
- $layout: -4611 -73 300

## CreateSessionModal

*hidden*
- $layout: -3966 456 300

## SessionCard
- date
- addToCalendar: button
- title
- description

*hidden*
- $layout: -3986 752 300

## TimelineTab: comp
- model: string
  Thread id
  
- items: TimelineResult
  Items are loaded on demand
  - $link: GetTimelineFn
  - src:GetTimelineFn({threadId:model})

- sideBar
  - src: items.items
  - $link: TimelineSideBar
  
- listView
  - src: items.items
  - $link: SessionReview
  - $link: PostCollection



*hidden*
- $layout: -5700 111 300

## SessionReview: comp
- model: TimelineItem
- date
  - src: model.startDate
- title
  - src: model.src
- description
  - src: model.description
- attendeesCount
  - src: model.attendeesCount
- postCount
  - src: model.postCount
- lengthMinutes
  - src: model.lengthMinutes
- questionCount
  - src: model.questionCount
- questionList
  - $link: MultiChoiceQuestionReview
  - $link: MediaQuestionReview

*hidden*
- $layout: -6156 430 300

## MediaQuestionReview: comp
- question: Post
- title
  (example) question 2
- questionTitle
  The question
- responses
  Grid view of the responses
  (?) What does this look like for 
  non-media questions
  - pagination 


*hidden*
- $layout: -6718 355 300

## MultiChoiceQuestionReview: comp
- question: Post
- title
  (example) question 2
- questionTitle
  The question
- options
  The possible answers with the
  correct answer highlighted


*hidden*
- $layout: -6703 728 300

## TimelineSideBar: comp
Used for quick navigation between
items in a timeline. Each item
which represents a collection of
threads and posts are displayed
by date.

The bar can be expanded to show 
more details about the item
such as a description or thumbnail

- model: TimelineItem[]

- expanded: boolean
  - src: state.expanded

*hidden*
- $layout: -6177 73 300

## PeopleTab: comp
- model: SpaceModel

- title: string
  - src: model.featuredMember.typeName
  
- titlePlural?: string
  - src: model.featuredMember.typeName
  (?) What if the featured members are
  different types such as a teacher and
  a zoo keeper

- featuredMembers: ThreadMember[]
  - src: model.featuredMembers
  - $link: MemberCard

- allMembers
  - src: model.members
  - $link: MemberListItem

*hidden*
- $layout: -5389 791 300

## MemberCard
- model: ThreadMember
- title: string
  - src: model.name
- imageUrl
  - src: model.profileImageUrl
- description
  - $link: GetUserInfoFn
  - src: GetUserFn({id:model.id}).description
  - $link: GetUserFn
- links: LinkInfo[]
  - src: model.links

*hidden*
- $layout: -4824 838 300

## MemberListItem
- model: ThreadMember
- title: string
  - src: model.name
- imageUrl
  - src: model.profileImageUrl
  - $link: GetUserFn
- links: LinkInfo[]
  - src: model.links

*hidden*
- $layout: -4887 1175 300

## SpaceModel: struct

- thread: Thread

- nextSession?: Thread

- upcomingSessions: Thread[]
  The next N upcoming sessions. Later
  sessions will be loaded as needed
  
- members: ThreadMember[]
  - orderBy: order, created
  
- featuredMember?:ThreadMember
  - src: members.find(m=>m.isFeatured)
  
- featuredMembers:ThreadMember[]
  - src: members.filter(m=>m.isFeatured)

*hidden*
- $layout: -5741 -445 300

## GetUserInfoFn: fn
Looks up user info given its input 
parmeters

- input:
  - $link: UserMatchOptions
- output: UserInfo
  - $link: UserInfo

*hidden*
- $layout: -3948 1255 300

## UserInfo: struct
A public view of a User object
- name: string
- description: string
...

*hidden*
- $layout: -3331 1396 300

## UserMatchOptions: struct
- id?: string
- name?: string
- email?: string
- phone?: string

*hidden*
- $layout: -3357 1190 300

## GetTimelineFn: fn
- input: TimelineRequest
  - $link: TimelineRequest
- output: TimelineResult
  - $link: TimelineResult

*hidden*
- $layout: -6156 -638 300

## TimelineRequest: struct
- threadId?: string
- page?: string
  Used for pagination

*hidden*
- $layout: -6715 -978 300

## TimelineItem: struct
- title: string
- type: TimelineItemType
  - $link: TimelineItemType
- threads: Thread[]
- posts: Post[]
- startDate: number
- endDate?: number
- sessionInfo?: SessionInfo *

*hidden*
- $layout: -6735 -554 300

## TimelineResult: struct
- items: TimelineItem[]
  - $link: TimelineItem

*hidden*
- $layout: -6732 -740 300

## TimelineItemType: union

- postCollection
  A collection of posts that are
  typically related in some way
  
- session
  A session thread and its posts

*hidden*
- $layout: -6730 -277 300

## GetSpaceModelFn: fn

- input: SpaceModelRequest
  - $link: SpaceModelRequest
- output: SpaceModel

*hidden*
- $layout: -5207 -658 300

## SpaceModelRequest: struct
- threadId: string

*hidden*
- $layout: -5661 -757 300

## MainNavigation

- spaces: ThreadInfo[]
  - $link: SpaceScreen
  - $link: ThreadInfo

*hidden*
- $layout: -2823 -847 300

## ThreadInfo: struct
- name: string
- image

*hidden*
- $layout: -2473 -941 300

## calculateThreadPermissionAsync: function

1. find matching member
2. if no matching return empty roles
3. find linked threads
4. for each thread that allows roles to pass 
  through adds roles
5. recursively repeat steps 3 and 4 

- input: CalculateThreadPermissionsOption
  - $link: CalculateThreadPermissionOptions
- output: ThreadPermission
  - $link: ThreadPermission
  
  


*hidden*
- $layout: -929 -512 300

## CalculateThreadPermissionOptions: struct
- userId: string :User
- threadId: string :Thread

*hidden*
- $layout: -1496 -505 300

## PostCollection: comp
A grid layout of posts. Posts 
are group by time

- model: TimelineItem[]
*hidden*
- $layout: -6061 853 300

## SessionInfo: struct
- name: string
- attendeesCount: int
- postCount: int
- lengthMinutes: int
- questionCount: int


*hidden*
- $layout: -7213 -517 300