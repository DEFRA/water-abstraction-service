# {{ taskConfig.config.subject }}
Water Resources Act 1991  
Our reference: {{ ref }}

Dear licence holder,

# All or part of the following abstraction licence{{ 's' if pluralLicence }} will expire soon:

{% for licence in licences %}
{% for point in licence.points %}
{{ licence.licenceNumber }} for {{ point.name }}{% if licence.expiryDate %} expires on {{ licence.expiryDate }}{% endif %}
{% endfor %}
{% endfor %}

# When to submit your renewal application{{ 's' if pluralLicence }}

If you want to continue abstracting water after the expiry date{{ 's' if pluralLicence }} included above, please send your renewal application{{ 's' if pluralLicence }} to us by {{ params.application_date }}.

This will ensure we have enough time to process your application{{ 's' if pluralLicence }} before your current licence{{ 's' if pluralLicence }} expire{{ 's' if pluralLicence == false }}.


# How to apply to renew your licence{{ 's' if pluralLicence }} with different terms

If you want to change any of the terms of your current licence{{ 's' if pluralLicence }}, you need to submit a new licence application.

The application forms can be found on our website: https://www.gov.uk/guidance/water-management-apply-for-a-water-abstraction-or-impoundment-licence


# How to apply to renew your licence{{ 's' if pluralLicence }} with exactly the same terms

Please complete this online form for each licence: https://www.gov.uk/guidance/apply-to-renew-a-water-abstraction-licence.

# How to complete your renewal form{{ 's' if pluralLicence }}

You must check that the following details are correct:

* the licence holder's name and contact details
* the abstraction point, reach and area you take water from
* what you use the water for
* the abstraction period{{ 's' if pluralLicence }}


You must also demonstrate your need to abstract the same quantities of water as your current licence allows. To do this you need to include:

* details about how you use your current abstraction quantities
* usage information from previous years (if you have this information)
* if you abstract water for spray irrigation, include the type and area of crops you will grow and irrigate

^We cannot process your renewal application{{ 's' if pluralLicence }} if you do not provide all of this information.


# How to submit your renewal form{{ 's' if pluralLicence }}


When you submit your form, you must also include:

* your £135 application fee
* a map showing the area of land you have a right of access to, and the point, reach or area you take water from

Your application form{{ 's' if pluralLicence }} must be signed by the correct person, as described below.  If you are:

* an Individual then you need to sign the application
* a number of individuals then you all need to sign the application
* a Limited Liability Partnership then a partner, company director or company secretary need to sign the application
* a Registered Company then the Company Director or Company Secretary need to sign the application
* a Public Body (such as a local authority or NHS trust) then a person authorised to sign documents on behalf of the organisation needs to sign the application
* a Partnership then one or more of the partners must sign the application
* a Trust then all trustees or the chairman, treasurer or secretary must sign the application


# What happens after you apply

We will consider your application and should be able to grant you a new licence provided that:

* you submit the information and payment detailed in this notification
* your abstraction is environmentally sustainable
* you have justified the amount of water you need to abstract
* you demonstrate that you are using water efficiently

We will contact you if we need any more information to process your renewal application{{ 's' if pluralLicence }}.

You may also receive a letter from your local area team about future changes we may need to make to ensure your abstraction is sustainable.


# How to contact us

To discuss any changes you would like to make please call us on 03708 506 506.



Yours faithfully

{{ params.sender_name }}  
{{ params.sender_role }}  
{{ params.sender_address }}
