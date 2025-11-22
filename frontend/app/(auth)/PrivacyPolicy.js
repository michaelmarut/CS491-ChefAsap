import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-base-100 dark:bg-base-dark-100 p-5">
      <Text className="text-3xl font-bold text-center text-primary-500 dark:text-dark-500 mb-2">
        Privacy Policy
      </Text>
      
      <Text className="text-center text-warm-gray mb-4">
        Last Updated: November 22, 2025
      </Text>

      <Card>
        <Text className="text-sm text-primary-400 dark:text-dark-400 leading-6 whitespace-pre-line">
{`CHEFASAP PRIVACY POLICY

Terms of Service 
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
Privacy Policy 
ChefAsap - Privacy Policy 
Last Updated: November 16, 2025 
This Privacy Policy describes how JKG Brothers LLC ("we," "us," or "our") collects, uses, and 
shares your personal information when you use our ChefAsap mobile application (the 
"Service"). 
By using the Service, you agree to the collection and use of information in accordance with this 
policy. 
1. Information We Collect 
We collect several different types of information for various purposes to provide and improve our 
Service to you. 
1.1 Information Provided by Users (Registration and Profiles) 
Data Type 
Contact Data (Name, Email, 
Phone Number) 
Collected 
From 
All Users 
Purpose 
Account creation, essential 
communication, service updates. 
Location Data 
Profile Data (Cuisine preference, 
dietary needs, profile picture) 
Chef Verification Data (Business 
registration, licenses, permits) 
Customers & 
Chefs 
All Users 
Chefs Only 
To connect Customers with nearby 
Chefs; Chefs' defined service area. 
Personalizing the experience and 
public Chef profiles. 
Verification of compliance and 
professional status (see Section 3 of 
ToS). 
Financial Data (Bank 
account/routing details) 
1.2 Transaction Information 
Chefs Only 
Processing payouts for services 
rendered. 
When Customers place an order, we collect information related to that transaction, including: 
● Order details (items, price, date, time). 
● Reviews and ratings provided to Chefs. 
1.3 Payment Information 
We do not directly store your credit card details. All payment information is securely collected 
and processed by our third-party payment processor (Stripe). We only retain tokens generated 
by the processor that allow us to authorize future payments. 
1.4 Usage Data 
We may also collect information that your device sends whenever you visit our Service ("Usage 
Data"). This Usage Data may include information such as your phone’s Internet Protocol 
address (e.g., IP address), the pages of our Service that you visit, the time and date of your 
visit, and device identifiers. 
2. How We Use Your Information 
We use the collected data for various purposes, including: 
● To provide, maintain, and improve the Service. 
● To facilitate connections between Customers and nearby Chefs. 
● To process transactions and send confirmation notices. 
● To verify Chef identities and compliance with platform standards. 
● To allow Customers to leave reviews and ratings of Chefs. 
● To monitor the usage of the Service and detect, prevent, and address technical issues or 
illegal activity. 
● To provide you with news, special offers, and general information about other goods, 
services, and events which we offer, unless you have opted not to receive such 
information. 
3. Sharing and Disclosure of Information 
We share your personal information in the following circumstances: 
3.1 Sharing Between Customers and Chefs 
The core function of ChefAsap requires sharing data between users: 
● Customer to Chef: When an order is placed, the Chef receives the Customer's name, 
phone number, location, and order details to fulfill the request. 
● Chef to Customer: Customers can view the Chef’s public profile, business name, 
cuisine type, menu, ratings, and general proximity/service area. 
3.2 With Service Providers 
We may employ third-party companies and individuals to facilitate our Service ("Service 
Providers"), such as payment processors, cloud hosting providers, and analytics providers. 
These third parties have access to your Personal Data only to perform these tasks on our behalf 
and are obligated not to disclose or use it for any other purpose. 
3.3 For Legal Requirements 
We may disclose your Personal Data in the good faith belief that such action is necessary to: 
● Comply with a legal obligation (e.g., valid subpoena or court order). 
● Protect and defend the rights or property of JKG Brothers LLC. 
● Protect the personal safety of users of the Service or the public. 
4. Data Security 
The security of your data is important to us. We implement commercially acceptable means to 
protect your Personal Data, including encryption and secure storage practices. However, 
remember that no method of transmission over the Internet or method of electronic storage is 
100% secure. While we strive to use commercially acceptable means to protect your Personal 
Data, we cannot guarantee its absolute security. 
5. Your Data Protection Rights 
You may have the right to access, update, or delete the personal information we hold about you. 
You can typically manage your profile information directly through your account settings. If you 
wish to exercise other rights, please contact us using the information in Section 7. 
6. Children's Privacy 
Our Service is intended for individuals who are 18 years of age or older. We do not knowingly 
collect personally identifiable information from anyone under the age of 18. If you are a parent 
or guardian and you are aware that your child has provided us with Personal Data, please 
contact us. 
7. Contact Us 
If you have any questions about this Privacy Policy, please contact us: 
Email: ChefAsapSupport@gmail.com  
Address: 21 Jump Street, Newark, NJ 07102 
[End of Privacy Policy] `}
        </Text>
      </Card>

      <Button
        title="← Back"
        style="secondary"
        onPress={() => router.back()}
      />

      <View className="h-8" />
    </ScrollView>
  );
}
