/**
 * Application Type Definitions (JSDoc for JavaScript)
 *
 * @typedef {Object} Role
 * @property {number} [id]
 * @property {string} name
 *
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {Role[]} [roles]
 *
 * @typedef {Object} Post
 * @property {number} id
 * @property {string} title
 * @property {string} content
 * @property {User} author
 * @property {string} createdAt
 * @property {string} updated
 * @property {number} [likeCount]
 * @property {number} [commentCount]
 *
 * @typedef {Object} Comment
 * @property {number} id
 * @property {string} content
 * @property {User} author
 * @property {string} createdAt
 * @property {string} updated
 *
 * @typedef {Object} AuthResponse
 * @property {string} token
 */

export {}
