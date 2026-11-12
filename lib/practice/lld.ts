import type { Practice } from './types';

/** "Try it yourself" exercises for the LLD machine-coding case studies, keyed by page URL. */
export const LLD_PRACTICE: Record<string, Practice> = {
  '/lld/case-studies/parking-lot': {
    prompt: 'Design the classes for a multi-floor parking lot with entry and exit panels.',
    requirements: [
      'Spots of different sizes (bike, car, truck) across floors',
      'Assign the nearest suitable free spot on entry and issue a ticket',
      'Calculate the fee on exit with pricing that can change',
      'Show free spots per floor on display boards',
      'Two cars at different entrances must never get the same spot',
    ],
    hints: [
      'List the nouns first: lot, floor, spot, vehicle, ticket, panel. Which are abstract?',
      'Which pattern lets you swap pricing rules (hourly, weekend, flat) without touching the lot?',
      'Where exactly is the critical section when two entrances assign spots at once?',
    ],
  },
  '/lld/case-studies/elevator-system': {
    prompt: 'Design an elevator controller for a building with several elevator cars.',
    requirements: [
      'Hall calls (up or down at a floor) and car calls (floor buttons inside a car)',
      'Dispatch each hall call to a suitable car',
      'Cars serve requests efficiently and do not starve any floor',
      'Door, direction and idle states per car',
      'Swap the dispatching algorithm without rewriting the system',
    ],
    hints: [
      'Model a car\'s states (idle, moving up, moving down, doors open). Is a state pattern useful here?',
      'Compare dispatch strategies: nearest car, same-direction car, the SCAN/LOOK disk scheduling idea.',
      'Requests come from many threads. How do you keep each car\'s request queue consistent?',
    ],
  },
  '/lld/case-studies/splitwise': {
    prompt: 'Design the classes for Splitwise: users add shared expenses and see who owes whom.',
    requirements: [
      'Add an expense paid by one user and split among several',
      'Split equally, by exact amounts or by percentages',
      'Show each user\'s balance with every other user and within a group',
      'Simplify debts so the group settles with as few payments as possible',
      'Money must never be off by a rounding cent',
    ],
    hints: [
      'Represent money as integer minor units, not floats. Where does the leftover cent go on an uneven split?',
      'Which pattern fits the different split types?',
      'Debt simplification: compute each person\'s net balance first, then match the biggest debtor with the biggest creditor.',
    ],
  },
  '/lld/case-studies/movie-booking': {
    prompt: 'Design the classes for a movie booking system with seat selection and payment.',
    requirements: [
      'Cinemas, screens, shows and a seat layout per screen',
      'Select seats and hold them for a few minutes during payment',
      'Two users can never book the same seat',
      'Holds expire automatically if payment does not complete',
      'Cancel a booking and release the seats',
    ],
    hints: [
      'Seat state belongs to a show, not to the screen. Why?',
      'Where is the critical section, and what lock or atomic operation protects it?',
      'How do expired holds get released: a timer per hold, a sweeper, or checking expiry on read?',
    ],
  },
  '/lld/case-studies/chess-game': {
    prompt: 'Design the classes for a two-player chess game.',
    requirements: [
      'Board, pieces and legal moves for each piece type',
      'Detect check, checkmate and stalemate',
      'Special moves: castling, en passant, promotion',
      'Undo moves and show move history',
      'Easy to add a new variant or a computer player',
    ],
    hints: [
      'Should each piece know how it moves (polymorphism), or should a rules engine decide?',
      'How do you check that a move does not leave your own king in check?',
      'Which patterns give you undo and history (command, memento)?',
    ],
  },
  '/lld/case-studies/cache-lru-lfu': {
    prompt: 'Design a fixed-capacity in-memory cache with O(1) get and put, supporting LRU and LFU eviction.',
    requirements: [
      'get(key) and put(key, value) in O(1)',
      'Evict the least recently used entry (LRU) or least frequently used (LFU) when full',
      'Choose the eviction policy at construction time',
      'Optional time-to-live per entry',
      'Safe to use from several threads',
    ],
    hints: [
      'LRU: which two data structures together give O(1) lookup and O(1) move-to-front?',
      'LFU: how do frequency buckets plus a minimum-frequency pointer keep eviction O(1)?',
      'Thread safety: one lock, a read-write lock, or lock striping? What does each cost?',
    ],
  },
  '/lld/case-studies/logger': {
    prompt: 'Design a logging library like Log4j or Python\'s logging module.',
    requirements: [
      'Log levels (debug, info, warn, error) with a configurable minimum level',
      'Several outputs at once: console, file, remote',
      'Configurable message format',
      'Logging must not slow down the calling thread much',
      'Named loggers configured per module',
    ],
    hints: [
      'Separate what is logged (event), where it goes (appender) and how it looks (formatter).',
      'How would an async appender work, and what happens when its buffer is full?',
      'Which patterns fit: singleton or factory for loggers, strategy for formatters, decorator for async?',
    ],
  },
  '/lld/case-studies/rate-limiter-lld': {
    prompt: 'Design an in-process rate limiter library with pluggable algorithms.',
    requirements: [
      'allow(clientId) returns true or false',
      'Support fixed window, sliding window and token bucket algorithms',
      'Different limits per client or per tier',
      'Thread-safe under concurrent calls',
      'Memory stays bounded with many clients',
    ],
    hints: [
      'Define one interface and make each algorithm an implementation.',
      'Token bucket: do you need a background refill thread, or can you refill lazily on each call?',
      'How do you evict state for clients that have gone quiet?',
    ],
  },
  '/lld/case-studies/vending-machine': {
    prompt: 'Design a vending machine that accepts coins and notes, dispenses items and gives change.',
    requirements: [
      'Select an item, insert money, dispense the item and change',
      'Cancel and refund at any point before dispensing',
      'Refuse a sale if exact change cannot be given',
      'Track inventory and cash',
      'Admin can restock items and collect cash',
    ],
    hints: [
      'Draw the state machine first: idle, has money, dispensing, out of stock.',
      'How does the state pattern keep each state\'s allowed actions in one place?',
      'Change-making: does a greedy algorithm always work for your coin set?',
    ],
  },
  '/lld/case-studies/tic-tac-toe': {
    prompt: 'Design a tic-tac-toe game for two players on an N×N board.',
    requirements: [
      'Players take turns placing marks',
      'Detect a win or a draw',
      'Board size N is configurable',
      'Reject invalid moves',
      'Easy to add a computer player',
    ],
    hints: [
      'Can you detect a win in O(1) per move instead of scanning the board?',
      'Hint: keep counters per row, column and both diagonals.',
      'Model players behind an interface so human and computer players are interchangeable.',
    ],
  },
  '/lld/case-studies/snake-and-ladder': {
    prompt: 'Design the classes for a snake and ladder game with several players.',
    requirements: [
      'Board with configurable snakes and ladders',
      'Players take turns rolling dice and moving',
      'Win when exactly reaching the last square (or a configurable rule)',
      'Support one or more dice and custom dice',
      'Easy to add new rules or special squares',
    ],
    hints: [
      'Do snakes and ladders need separate classes, or are both a jump from one square to another?',
      'Which pattern makes the dice swappable?',
      'How does the game loop pick the next player and end the game?',
    ],
  },
  '/lld/case-studies/library-management': {
    prompt: 'Design a library management system for books, members and loans.',
    requirements: [
      'Catalog of titles with multiple physical copies',
      'Members borrow and return copies, with limits per member',
      'Place holds on a title; the next copy goes to the first in line',
      'Fines for late returns',
      'Search by title, author or subject',
    ],
    hints: [
      'Separate a book (the title) from a book item (one physical copy).',
      'Model the hold queue per title. What happens when a copy is returned?',
      'Where does fine calculation live, and how would you change the fine policy later?',
    ],
  },
  '/lld/case-studies/hotel-booking': {
    prompt: 'Design the classes for a hotel booking system.',
    requirements: [
      'Rooms of different types and prices',
      'Search availability for a date range',
      'Book, cancel, check in and check out',
      'Never double-book a room for overlapping dates',
      'Pricing that varies by season or demand',
    ],
    hints: [
      'How do you represent availability so a date-range check is fast?',
      'What is the critical section when two guests book the last room for overlapping dates?',
      'Which pattern keeps pricing rules swappable?',
    ],
  },
  '/lld/case-studies/car-rental': {
    prompt: 'Design the classes for a car rental system.',
    requirements: [
      'Vehicles of different types at different locations',
      'Reserve a vehicle for a date range, then pick up and return',
      'Return to a different location',
      'Pricing by duration and vehicle type, with extras like insurance',
      'No overlapping reservations for the same vehicle',
    ],
    hints: [
      'Reservation vs rental: are these the same object at different states, or different objects?',
      'How do you check a vehicle\'s calendar for overlaps?',
      'Pricing and extras: strategy, decorator, or both?',
    ],
  },
  '/lld/case-studies/airline-management': {
    prompt: 'Design the classes for an airline booking and management system.',
    requirements: [
      'Flights on routes with schedules and aircraft',
      'Search including multi-leg journeys',
      'Book several seats for several passengers atomically',
      'Seat classes and seat maps per aircraft',
      'Cancellation with different refund rules',
    ],
    hints: [
      'Separate a scheduled flight (route and time) from a flight instance on a date with its own seat state.',
      'Booking several seats: how do you make it all-or-nothing?',
      'Which pattern fits refund rules that differ by fare class?',
    ],
  },
  '/lld/case-studies/food-delivery': {
    prompt: 'Design the classes for a food delivery app like Swiggy or Zomato.',
    requirements: [
      'Restaurants with menus; customers build a cart and place orders',
      'Order lifecycle from placed to delivered, including cancellation',
      'Assign a delivery partner to each order',
      'Pricing with delivery fees, taxes and coupons',
      'Notify customers when the order status changes',
    ],
    hints: [
      'List the order states and allowed transitions. Is a state pattern worth it?',
      'Which strategies could choose a delivery partner (nearest, least busy)?',
      'Which pattern notifies several parties when an order changes status?',
    ],
  },
  '/lld/case-studies/online-shopping-cart': {
    prompt: 'Design the classes for a shopping cart and checkout.',
    requirements: [
      'Add, update and remove items in a cart',
      'Apply coupons and discounts with clear rules on stacking',
      'Calculate totals with taxes',
      'Checkout creates an order and takes payment',
      'Handle price or stock changes between adding to cart and checkout',
    ],
    hints: [
      'Model pricing as a pipeline of steps (base price, discounts, tax). Why does order matter?',
      'Which pattern fits different coupon types?',
      'What do you re-validate at checkout, and what do you tell the user if something changed?',
    ],
  },
  '/lld/case-studies/inventory-management': {
    prompt: 'Design an inventory system that tracks stock across warehouses.',
    requirements: [
      'Stock per product per warehouse',
      'Reserve stock for an order, then commit or release it',
      'Transfer stock between warehouses',
      'Reorder automatically when stock falls below a threshold',
      'Full history of every stock movement',
    ],
    hints: [
      'Separate on-hand, reserved and available quantities.',
      'Why keep an append-only log of stock movements as well as current counts?',
      'Which pattern triggers reordering when stock changes?',
    ],
  },
  '/lld/case-studies/meeting-scheduler': {
    prompt: 'Design a meeting room scheduler.',
    requirements: [
      'Book a room for a time slot with a list of attendees',
      'Find free rooms for a time slot and capacity',
      'Reject overlapping bookings for the same room',
      'Recurring meetings',
      'Notify attendees of bookings and changes',
    ],
    hints: [
      'How do you store a room\'s bookings so overlap checks are fast (sorted list, interval tree)?',
      'Recurring meetings: store each occurrence or a rule plus exceptions?',
      'Two people booking the same room at the same instant: where is the lock?',
    ],
  },
  '/lld/case-studies/file-system': {
    prompt: 'Design an in-memory Unix-like file system.',
    requirements: [
      'mkdir with nested paths',
      'ls on a file or a directory, in sorted order',
      'Create a file and append content to it',
      'Read a file\'s content',
      'Path parsing handles edge cases like the root and trailing slashes',
    ],
    hints: [
      'Files and directories share behaviour. Which pattern models a tree of both?',
      'How does a directory store its children so ls returns sorted names cheaply?',
      'How would you add permissions or move and rename later?',
    ],
  },
  '/lld/case-studies/stack-overflow': {
    prompt: 'Design the classes for a Q&A site like Stack Overflow.',
    requirements: [
      'Post questions and answers, and comment on both',
      'Vote up or down; a user\'s vote can be changed but not counted twice',
      'Reputation changes based on votes and accepted answers',
      'Tags and search by tag',
      'Accept an answer and close questions',
    ],
    hints: [
      'What do questions and answers have in common? Consider a shared base class.',
      'How do you make voting idempotent and support switching a vote?',
      'Where do reputation rules live so they can change?',
    ],
  },
  '/lld/case-studies/linkedin-connections': {
    prompt: 'Design the connection graph for a professional network like LinkedIn.',
    requirements: [
      'Send, accept and reject connection requests',
      'List a user\'s connections and mutual connections with another user',
      'Show the degree of connection (1st, 2nd, 3rd)',
      'Suggest people you may know',
      'Block users',
    ],
    hints: [
      'How do you store the graph: adjacency lists, and are edges stored once or twice?',
      'Degree of connection: BFS from one side, or from both sides at once?',
      'Suggestions: rank second-degree connections by the number of mutual connections.',
    ],
  },
  '/lld/case-studies/traffic-signal': {
    prompt: 'Design a traffic signal controller for an intersection.',
    requirements: [
      'Phases that give green to compatible directions, with timings',
      'Lights never show conflicting greens',
      'Configurable phase plans per intersection',
      'Emergency vehicle override',
      'Pedestrian crossing requests',
    ],
    hints: [
      'Draw the state machine of phases and transitions, including yellow and all-red.',
      'How do you guarantee two conflicting directions are never green at once?',
      'How does an override interrupt the cycle safely and then resume?',
    ],
  },
  '/lld/case-studies/atm-system': {
    prompt: 'Design the classes for an ATM.',
    requirements: [
      'Authenticate with card and PIN',
      'Check balance, withdraw cash and deposit',
      'Dispense the requested amount with the available notes',
      'Every transaction is logged and can be reconciled with the bank',
      'Handle a failure after the bank debits but before cash is dispensed',
    ],
    hints: [
      'List the ATM states: idle, card inserted, authenticated, transaction in progress.',
      'Which parts talk to the bank, and what happens when that call times out?',
      'How do you dispense cash with the fewest notes given the cassettes you have?',
    ],
  },
};
