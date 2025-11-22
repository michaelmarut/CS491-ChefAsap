"""
Update existing Terms of Service agreement in the database
This script will:
1. Deactivate the old agreement
2. Insert a new version of the agreement
"""
import sys
import os

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_helper import get_db_connection, get_cursor
from datetime import datetime

def update_agreement():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = get_cursor(conn, dictionary=True)
        
        # Updated Terms of Service content - MODIFY THIS SECTION
        new_terms_content = """
CHEFASAP TERMS OF SERVICE

ChefAsap - Terms of Service 
Last Updated: November 16, 2025
Please read these Terms of Service ("Terms") carefully before using the ChefAsap mobile 
application (the "Service") operated by JKG Brothers LLC ("us", "we", or "our"). 

Your access to and use of the Service is conditioned upon your acceptance of and compliance 
with these Terms. These Terms apply to all visitors, users, customers ("Customers"), and chefs 
("Chefs") who access or use the Service. 

By accessing or using the Service you agree to be bound by these Terms. If you disagree with 
any part of the terms, then you may not access the Service. 

1. The Service 
ChefAsap is a platform that connects users ("Customers") seeking prepared meals or catering 
services with independent, verified food preparation professionals ("Chefs") operating within a 
defined geographical area. 

We are not a party to the contractual relationship between a Customer and a Chef. We act 
solely as a technology platform to facilitate the connection and communication. We are not 
responsible for the quality, safety, legality, or any other aspect of the services provided by the 
Chefs. 

2. Accounts and Registration 

2.1 Eligibility 
You must be at least 18 years of age to use the Service. By using the Service, you represent 
and warrant that you are of legal age. 

2.2 Account Types 
The Service offers two main types of accounts: 
● Customer Accounts: For individuals seeking to find and order services from Chefs. 
● Chef Accounts: For food preparation professionals who wish to offer their services 
  through the platform. Chefs must complete a verification process (see Section 3). 

2.3 Account Security 
You are responsible for safeguarding the password that you use to access the Service and for 
any activities or actions under your password, whether your password is with our Service or a 
third-party service. You agree not to disclose your password to any third party. You must notify 
us immediately upon becoming aware of any breach of security or unauthorized use of your 
account. 

3. Terms Specific to Chefs 

3.1 Verification and Compliance 
Chefs must submit to and successfully pass a verification process, which may include, but is not 
limited to: 
● Providing valid identification and business registration. 
● Submitting proof of required licenses, permits, and food handling certifications in their 
  jurisdiction. 
● Demonstrating compliance with all local, state, and national health, safety, and hygiene 
  regulations related to food preparation and sales. 
● Undergoing a background check. 

We reserve the right to remove or suspend any Chef account at any time if we suspect 
non-compliance with these requirements or any illegal activity. 

3.2 Independent Contractor Status 
Chefs are independent contractors and not employees, agents, partners, or joint venturers of 
ChefAsap. Chefs are solely responsible for all taxes, insurance, and other liabilities arising from 
their services. 

3.3 Service Quality 
Chefs are solely responsible for the quality, accuracy, freshness, and delivery of the meals and 
services they provide to Customers. ChefAsap does not guarantee any level of business or 
income for Chefs. 

4. Ordering, Payment, and Cancellations 

4.1 Pricing and Fees 
Chefs set their own prices for their services. ChefAsap will charge a service fee, which will be 
clearly displayed during the transaction process, to both the Customer and/or the Chef for use 
of the platform.

4.2 Payment Processing 
All payments are processed through a third-party payment processor (Stripe). You agree to 
comply with the terms and conditions of that processor. ChefAsap is not responsible for any 
issues arising from the payment processor's services. 

4.3 Cancellations and Refunds 
Cancellation is free if done more than twenty-four hours before the Service, otherwise a 
cancellation fee is charged to the customer. Refund policies are primarily determined by the 
individual Chef and must be clearly communicated by the Chef. ChefAsap may facilitate the 
processing of refunds according to the Chef's policy, but is not responsible for refunding the cost 
of the service itself. 

5. User Content and Conduct 

5.1 User Content 
Our Service allows you to store, share, and otherwise make available certain information, text, 
graphics, or other material ("User Content"). You are responsible for the User Content that you 
post on or through the Service, including its legality, reliability, and appropriateness. 

5.2 Prohibited Conduct 
You agree not to use the Service to: 
● Violate any laws or regulations. 
● Transmit any materials that are defamatory, abusive, or harassing. 
● Post or transmit any content that infringes upon the rights of others (e.g., copyright, 
  trademark). 
● Engage in any form of fraudulent activity, including payment fraud or misleading 
  information about services or quality. 

6. Limitation of Liability 
In no event shall ChefAsap, nor its directors, employees, partners, agents, suppliers, or 
affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, 
including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
resulting from: 
● (i) your access to or use of or inability to access or use the Service; 
● (ii) any conduct or content of any third party on the Service (including Chefs);
● (iii) any food-borne illness, allergic reaction, property damage, or injury resulting from the 
  consumption of food or services provided by a Chef; and 
● (iv) unauthorized access, use, or alteration of your transmissions or content.

7. Governing Law 
These Terms shall be governed and construed in accordance with the laws of the United States 
of America, without regard to its conflict of law provisions. 

8. Changes to Terms 
We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a 
revision is material, we will try to provide at least 30 days' notice prior to any new terms taking 
effect. What constitutes a material change will be determined at our sole discretion. 

9. Contact Us 
If you have any questions about these Terms, please contact us at: 
Email: ChefAsapSupport@gmail.com  
Address: 21 Jump Street, Newark, NJ 07102 

[End of Terms of Service]
"""
        
        # New version number - INCREMENT THIS when updating
        new_version = "1.1"  # Change this to 1.2, 2.0, etc. for each update
        
        print("Starting agreement update process...")
        
        # Step 1: Deactivate old agreement(s)
        cursor.execute('''
            UPDATE agreements 
            SET is_active = FALSE, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE is_active = TRUE
        ''')
        
        old_count = cursor.rowcount
        print(f"Deactivated {old_count} old agreement(s)")
        
        # Step 2: Insert new agreement
        cursor.execute('''
            INSERT INTO agreements 
            (agreement_type, title, content, version, is_active, is_required, applicable_to, effective_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            'terms_of_service',  # agreement_type
            'ChefAsap Terms of Service',
            new_terms_content,
            new_version,
            True,
            True,
            'all',
            datetime.now().date()
        ))
        
        conn.commit()
        print(f" Successfully created new agreement version {new_version}!")
        print("The old agreement has been deactivated.")
        print("New users will see the updated terms.")
        print("\nNote: Existing users may need to re-accept the updated terms.")
        
    except Exception as e:
        print(f" Error updating agreement: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    # Confirmation prompt
    print("=" * 60)
    print("AGREEMENT UPDATE TOOL")
    print("=" * 60)
    print("This will:")
    print("  1. Deactivate all current active agreements")
    print("  2. Create a new agreement with updated content")
    print("=" * 60)
    
    response = input("Do you want to proceed? (yes/no): ").strip().lower()
    
    if response in ['yes', 'y']:
        update_agreement()
    else:
        print("Update cancelled.")
