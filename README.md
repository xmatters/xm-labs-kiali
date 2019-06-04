# Istio - Kiali <--> xMatters integration
This is part of the xMatters Labs awesome listing. For others, see [here](https://github.com/xmatters/xMatters-Labs)
With this library, notification recipients can quickly see how the microservices of their application are related in order to more efficiently fix errors.

This document details how to install and use this integration. 

---------

<kbd>
<img src="https://github.com/xmatters/xMatters-Labs/raw/master/media/disclaimer.png">
</kbd>

---------
# Pre-Requisites
* An application deployed in kubernetes broken up into microservices (via docker); see [here](https://istio.io/docs/examples/bookinfo/) for a basic example
* A communication plan, and access to names of microservices from a script - could be applicable to a stackdriver integration, adding the service name into the xmatters inbound, then getting the service's relations when notifying someone
* xMatters account - If you don't have one, [get one](https://www.xmatters.com)! 

# Files
* [kiali.js](./kiali.js) - This is the Kiali library you can use to retrieve information from Kiali
* [inbound.js](./inbound.js) - This is an example inbound script that shows you how to call each method from the kiali library

# Introduction - How it works
Kiali is an addon to install with Istio, that works in conjunction with the Istio service mesh to cleanly display a graph of how your services are related. The Kiali library is meant to extend Kiali's functionality to xMatters, to allow xMatters users to quickly understand how certain services in their application are related to each other. This can be especially useful when certain services break or have a high rate of error, and developer would like to see how the service breaking may affect other parts of their application. When using other xMatters integrations to monitoring applications (for example: stackdriver), the Kiali library may be useful in pointing developers in the right direction towards fixing the problem. 
<br/><br/>
Kiali displays a graph of your microservices, with each service being a "Node", and each relation between services is an "Edge". Two services are related if they communicate with each other and have network traffic between them (e.g. via rest call). In this library, we have chosen to show relationships as either "Parent" relationships or "Children" relationships, where parents are where traffic originates (the source), and children are where traffic is directed (the target). Often times, when a service breaks or shows a high frequency of error, it may actually be due an error with the parent, and Kiali helps visualize this tendency in order to make debugging less confusing.

This is an example of using the `getHtml` function and including the output in a Prometheus notification:
<kbd>
   <img src="/media/prometheus-kiali.png" width=200>
</kbd>

- - - -

# xMatters Integration Set-up:
## Prerequisites
1. A Communication Plan in xMatters 
2. An application in kubernetes with Istio installed, and access to service names via inbound or outbound script in xMatters
3. Have Kiali installed with Istio, and an exposed url that can be accessed to view the Kiali dashboard
## Kiali Library Set-up
1. Locate your Communication Plan (xMatters > **DEVELOPER** tab), click **Edit** > **Integration Builder**
2. Next to **Shared Libraries**, click Add
3. Change the name to something descriptive, e.g. `Kiali`
4. Copy [The Script](./kiali.js), then click **Save** the library
![add-library](./media/add-library.png)
5. Click `Edit Endpoints`, then click `Add Endpoint`
6. Give the endpoint a descriptive name (e.g. Kiali), then change the Base URL to be the endpoint you use to access kiali (without the 'kiali' part). For example, if you view the kiali dashboard at `http://34.66.248.57:15029/kiali`, then your endpoint would be `http://34.66.248.57:15029/`. If it is `https://mytelemetrydomain.xyz:15029/kiali`, then your endpoint is `https://mytelemetrydomain.xyz:15029/`
7. Add your Kiali username and password, then click **Save**
8. Click `Edit Constants`, then click `Add Constant`, set the name to **Kiali Endpoint**, using the same URL and port as part (6)
9. Add Kiali methods to other inbound/outbound scripts. See an example of how to call each method below

- - - - 

# Troubleshooting
1. If all kiali library methods are not working, check to verify that you have the correct endpoint with the same username and password you use to log in to `https://mytelemetrydomain.xyz:15029/kiali`
2. If a specific Kiali library method is not working, for example `getServiceRelations`, check to verify you are entering a valid namespace, and if you are also getting details for a specific service, make sure that service is inside the namespace you are passing in to them method. You can verify this by running `kubectl get svc -n [namespace]`, replacing `[namespace]` with the namespace you are using, and make sure the service you are looking for is shown in that namespace
3. If you have verified you are using the correct namespace and correct service name, make sure you have istio injection enabled in that namespace by checking `kubectl get namespaces --show-labels` shows the label `istio-injection=enabled` for the namespace you are using
- - - -

# Documentation
### Notes
* For methods that allow multiple namespaces, this means that if a service is related to a service in a different namespace, including both those namespaces will show that relationship, if you include only the namespace that one of those services is in, then you will not see that relationship (So you can choose whether or not to include relationships of monitoring applications like those that istio has with your application)
* The service names are the same as you see when doing `kubectl get services -n [namespace]', so the kialis methods will fail if you are attempting to get a service that is not in the namespace you specify
* If istio is not installed or working properly (especially the istio sidecar injector), then you may not get the output you expect to see
### Example Application
* Below you will see examples of output from the Kiali methods, they are taken from [this](https://github.com/GoogleCloudPlatform/microservices-demo) example application, the two graphs below show how the services are related (the first one is just the application, the second one is the application combined with istio)
![app-graph](./media/app-graph.png)
![app-and-istio-graph](./media/app-and-istio-graph.png)
### getAll
* Gets all services for a namespace, showing each service's parents and children
* params: 
    * namespaces: Single namespace (String) or list of namespaces to request a graph for
    * nparents: Number of parents to display (default=1)
    * nchildren: Number of children to display (default=1)
* return: A list (string) of each service and their parents and children
* calling this method:
```
kiali = require('kiali');
// to get services for a single namespace
kiali.getAll('namespace');
// to get services for multiple namespaces
kiali.getAll(['namespace1', 'namespace2', 'namespace3'], 10, 10);
```
* example output:  
![all-output](./media/all-output.png)

### getServiceRelations
* Gets the parents and children for a given service in a namespace
* params: 
    * namespaces: Single namespace (String) or list of namespaces to request a graph for
    * service: Name of the service to get
    * nparents: Number of parents to display (default=1)
    * nchildren: Number of children to display (default=1)
* return: Returns a string showing all (or nparents & nchildren) the service's parents and children
* calling this method:
```
kiali = require('kiali');
// to get the relations of a service for a single namespace
kiali.getServiceRelations('service', 'namespace');
// to get parents, grandparents, and great-grandparents, as well as children, grandchildren, and great-grandchildren of a service for a single namespace
kiali.getServiceRelations('service', 'namespace', 3, 3);
// to get the relations of a service for multiple namespaces
kiali.getServiceRelations('service', ['namespace1', 'namespace2', 'namespace3']);
```
* example output:  
![service-relations-output](./media/service-relations-output.png)


### getServiceDetails
* Gets the details for the given service, see example output at https://www.kiali.io/api/#operation/serviceDetails
* params: 
    * namespaces: Single namespace in which the service is running
    * service: Name of the service to get
* return: Returns the json of the service details, see [Service Details](https://www.kiali.io/api/#operation/serviceDetails) for explanation of the returned object
* calling this method:
```
kiali = require('kiali');
// to get the details of a service
kiali.getServiceDetails('service', 'namespace');
```
* example output: [see here](https://www.kiali.io/api/#operation/serviceDetails)

### getHtml
* Gets the Kiali graph as an HTML table with a row for each service, with a column containing a list of parent services, and a column containing a list of children services
* params: 
    * namespaces: Single namespace (String) or list (Array) of namespaces to request a graph for
* return: Returns the html (as a String) of all services as a table
* calling this method:
```
kiali = require('kiali');
// to get the html for one namespace
kiali.getHtml('namespace');
// to get the html for multiple namespaces
kiali.getHtml(['namespace1', 'namespace2', 'namespace3'])
```
* example output:  
![html-output](./media/html-output.png)

### getJson
* Gets the JSON representation of a service graph
* params: 
    * namespaces: Single namespace (String) or list (Array) of namespaces to request a graph for
* return: Returns the json (as a JavaScript Object) of the Kiali graph
* calling this method:
```
kiali = require('kiali');
// to get the JSON for one namespace
kiali.getJson('namespace');
// to get the JSON for multiple namespaces
kiali.getJson(['namespace1', 'namespace2', 'namespace3'])
```
* example output: [see here](https://www.kiali.io/api/#operation/graphNamespaces)
### getLink
* Gets the Link to the Kiali graph
* return: The link (as a string) to the Kiali graph
* calling this method:
```
kiali = require('kiali');
// to get the link for the graph of a single namespace
kiali.getLink('namespace');
// to get the link for the graph of multiple namespaces
kiali.getLink(['namespace1', 'namespace2', 'namespace3']);
```
* Note: this link leads you to the graphs shown at the beginning of this documentation
