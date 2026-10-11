# Demonstrate the PDF requirements

1. Start Docker, run npm install once, then npm run dev. Use its printed Local URL.
2. Browse/search products and categories, inspect Holiday Deals and a product page.
3. Add items, check the live quote, standard/express shipping and threshold discount.
4. Complete a simulated payment and record the order number and email.
5. Find that order in My Account, show the delivery timeline and submit a support ticket.
6. Start Jenkins with npm run jenkins. Configure quickcart-env and the SCM jobs for
   this installation; run the first pipeline to register its Git triggers.
7. Push a change and show Checkout, Test, Build Images, Deploy and Smoke Test.
8. Use an intentional failing test on an agreed demo branch/job to show deployment
   is skipped. Revert that demo change and verify a successful build.
9. Verify the original order survives deployment. Run quickcart-rollback using a
   previous successful compatible ROLLBACK_TAG, then verify the same order again.

Keep tagged images needed for rollback and the pg-data volume. Do not delete
volumes. Existing screenshots in jenkins-evidence document earlier completed
demonstrations, not new runs on another laptop.
