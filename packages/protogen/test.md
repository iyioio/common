## Thread
A multi view node
- id:string
- uv: number
- name:string
- abvName: string
  - abbreviated 1 or 2 chars
- description: string
- memberRequests: ThreadMemberRequest[]
- members?: ThreadMember[]
- logEvents: LogEvent[]
- defaultView: ThreadView
  - $link: ThreadView
- status: ThreadStatus
  - $link: ThreadStatus
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
- lastPost?: PostSummary
  - $link: PostSummary
- scenes?: string[]
  - $link: LocalizationPack
- localeOverrides: StringMap
- twilioRoomName?:string
- twilioRoomSid?:string

*hidden*
- $layout: -74 117 300

## User
- id:string
- uv: number
  - min: 7
    - message: nok
  - max: 8
    - message: nok
  - int
    - message: nok
  - positive
    - message: nok
  - negative
    - message: nok
  - notPositive
    - message: nok
  - notNegative
    - message: nok
  - finite
    - message: nok
  - safe
    - message: nok
  - gte: 7
    - message: nok
  - gt: 6
    - message: nok
  - lte: 5
    - message: nok
  - lt: 3
    - message: nok
  - multipleOf: 3
    - message: nok
  - step: 21
    - message: nok
- logEvents: LogEvent
- cognitoId?: string
- name:string
  - min: 2
    - message: ok
  - max: 255
    - message: ok
  - length: 25
    - message: ok
  - endsWith: end-bob
    - message: ok
  - startsWith: start-bob
    - message: ok
  - url
    - message: ok
  - emoji
    - message: ok
  - uuid
    - message: ok
  - cuid
    - message: ok
  - cuid2
    - message: ok
  - ulid
    - message: ok
  - notEmpty
    - message: ok
  - trim
    - message: ok
  - lower
    - message: ok
  - upper
    - message: ok
  - ip: v6
    - message: ok
  - date
    - message: ok
    - precision: 2
    - offset: true
  - regex: ^abc.*
    - message: ok
    - flags: gim
  - includes: poop
    - message: ok
- created: number
  - min: 1000
- email?: string
  - email
    - message: valid email required
  - max: 255
  - min: 2
- phone?: string
- links?: LinkInfo[]
  - $link: LinkInfo
- posts: Post[]
  - $link: Post.ownerId
- postApprovals: Post[]
  - $link: Post.approvedById
- memberRequests: ThreadMemberRequest[]
  - $link: ThreadMemberRequest.userId
- threadMemberApprovals: ThreadMemberRequest[]
  - $link: ThreadMemberRequest.approvedById
- threads: ThreadMember[] 
- profilePicture?: MediaSource
- dateProp: date
  - min: 2023-03-28
    - message: dok
  - max: 2024-03-28
    - message: dok
- longString: string
  - long
- intProp: int
  - max: 77

*hidden*
- $layout: 1467 245

## Post
- id: string
- uv: number
- created: number 
- yearMonth: string
  - yyyy-mm
- name:string
- type:string :PostType
  - $link: PostType
- public: boolean
  - If true all users can view the post
- logEvents: LogEvent
- ownerId?: string :User
- approvedById?: string :User
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
- questionResponseOptionId?:string
- questionType?: QuestionType
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
- $layout: 2371 532

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
- $layout: 3069 493

## ApprovalStatus: union
- pending
- approved
- denied

*hidden*
- $layout: -522 111

## FileInfo
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
- $layout: 2338 1714 300

## QuestionType: union
- multiChoice
- text
- media
- survey

*hidden*
- $layout: 3301 1411

## LogEvent
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
- $layout: 820 -211

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
- $layout: -925 933

## ThreadView: union
- util
- space
- canvas
- chat

*hidden*
- $layout: -773 330

## ThreadLink
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
- $layout: -761 581

## MediaSource
- sm?:FileInfo
- md?:FileInfo
- lg?:FileInfo
- source?:FileInfo
- additional?:FileInfo[]
  - $link: FileInfo
- blurPreview?:string

*hidden*
- $layout: 2014 1315

## MediaType: union
- image
- video
- audio

*hidden*
- $layout: 3138 1134

## QuestionOption
  - $link: Post.questionOptions
- id:string
- text?: string
- media?: MediaSource
- correctness?: number

*hidden*
- $layout: 3136 926

## ThreadMember
- id:string
- uv: number
- created: number 
- userId: string :User
  - $link: User.threads
- requestId?: string :ThreadMemberRequest
- threadId: string :Thread
  - $link: Thread.members
- roles: ThreadRole[]
  - $link: ThreadRole
- typeName?:string
  - student, teacher, creator etc
- name: string
  - source: user.name
- profileImageUrl?:string
  - source: user.profilePicture.sm
- isFeatured?:boolean

*hidden*
- $layout: 629 168 300

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
- $layout: -51 1102

## ThreadMemberRequest
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
- $layout: 839 650 300

## LocalizationPack
- id: string
- uv: number
- scene?: string
- locales?: string[]
  - en, en-us, mx, dk, etc
- map: StringMap

*hidden*
- $layout: 459 743 300

## LinkInfo
- name: string
- icon: string
- url: string

*hidden*
- $layout: 2040 307

## PostSummary
- title: string
- description: string
- thumbnailUrl?: string
- previewUrl?: string
- postId: string :Post

*hidden*
- $layout: -571 1033 300

## ThreadPermission
- tid: string :Thread
- roles: ThreadRole[]

*hidden*
- $layout: -1251 615
