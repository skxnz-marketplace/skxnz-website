# SKXNZ Auth And User Data Plan

## Current MVP Auth Reality

SKXNZ does not have real authentication connected yet. The current role system
is a demo role switch stored in browser `localStorage`.

That means:

- There are no real user accounts yet.
- There are no real passwords stored by SKXNZ.
- There are no production user sessions.
- Buyer, seller, and admin routes are still demo/MVP access patterns.

## Future Auth Direction

Use a trusted authentication provider later, such as Auth.js/NextAuth, Clerk,
Supabase Auth, or another approved provider. The selected provider should own:

- Password hashing.
- OAuth flows.
- Session rotation.
- Email verification.
- Password reset.
- Account security.

SKXNZ should not manually store raw passwords.

## User Tables Later

The Prisma schema should support:

- `users`
- `user_profiles`
- `buyers`
- `sellers`
- `admin_users`
- `addresses`
- `style_preferences`

The current `UserProfile` Prisma model is the profile model for general user
profile fields. It can be treated as the planned `Profile` layer.

## User Data To Store

Store only fields needed for marketplace behavior:

- Name.
- Email from auth provider.
- Phone number if provided.
- City/state/country.
- Style preference.
- Preferred fit.
- Budget range.
- Saved addresses.
- Style preference records.

## User Data Not To Store

Do not store:

- Raw passwords.
- Password reset secrets in plain text.
- Real card details.
- CVV codes.
- Unnecessary identity documents.
- Sensitive user photos without consent.
- Private data in Google Sheets or Excel.

## Buyer Profile Plan

Buyer profile should connect to:

- Addresses.
- Cart records.
- Wishlist records.
- Saved brands.
- Orders.
- Returns.
- Style preferences.

Guest browsing should still work without login.

## Seller Profile Plan

Seller profile should connect to:

- Seller application/review status.
- Store information.
- Product drafts.
- Product approvals.
- Inventory.
- Order items.
- Support tickets.

Seller login and seller approval remain future work. Do not claim live seller
verification until the real workflow is connected.

## Admin User Plan

Admin users should have:

- Auth provider identity.
- Permission mapping.
- Audit logs.
- Support assignment.
- Product/seller/order moderation actions.

Admin access must not rely on only frontend role switches in production.

## Account Creation Flow Later

Recommended sequence:

1. Add real auth provider in a private branch.
2. Create user records after verified auth signup/login.
3. Create buyer profile by default.
4. Sync guest cart after login.
5. Keep seller application separate from buyer signup.
6. Add admin roles manually in database or admin console.

