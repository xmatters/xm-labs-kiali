/*
 * Shared libraries allow you to write code once and reuse it in
 * multiple scripts in the Integration Builder.
 *
 * This library provides basic functions for retrieving information from kiali,
 * especially for getting the graph of services and displaying service relations
 *
 * To use this function in another script, include the following statement,
 *
 *  var kialiParser = require('Kiali Graph Parser');
 *
 * As an example for how to use this library, to get the service graph as html,
 *  var graphAsTable = kialiParser.getHtml();
 *
 * Included methods:
 * 
 * getAll:
 * Gets all services for a namespace, showing each services parents and children
 * param namespaces: Single namespace (String) or list (Array) of namespaces to request a graph for
 * param nparents: Number of parents to display (default=1)
 * param nchildren: Number of children to display (default=1)
 * return: Returns a list (string) of each service and their parents and children
 ***** kialiParser.getAll = function(namespaces, nparents=1, nchildren=1)
 *
 * getServiceRelations:
 * Gets the parents and children for a given service in a namespace
 * param namespaces: Single namespace (String) or list (Array) of namespaces to request a graph for
 * param service: Name of the service to get
 * param nparents: Number of parents to display (default=all)
 * param nchildren: Number of children to display (default=all)
 * return: Returns a string showing all (or nparents & nchildren) the service's parents and children
 ***** kialiParser.getServiceRelations = function(namespaces, service, nparents=null, nchildren=null)
 *
 * getServiceDetails:
 * Gets the details for the given service, see example output at https://www.kiali.io/api/#operation/serviceDetails
 * param namespaces: Single namespace to look for the service inside
 * param service: Name of the service to get
 * return: Returns the json of the service details
 ***** kialiParser.getServiceDetails = function(namespaces, service)
 *
 * getHtml:
 * Gets the Kiali graph as an HTML table with a row for each service, with a column
 * containing a list of parent services, and a column containing a list of children services
 * param namespaces: Single namespace (String) or list (Array) of namespaces to request a graph for
 * param filterOn: A service name to filter the full graph on. Filters service name, parents and children
 * return: Returns the html of all services as a table
 *
 ***** kialiParser.getHtml = function(namespaces)
 *
 * getJson:
 * Gets the JSON representation of a service graph
 * param namespaces: Single namespace (String) or list (Array) of namespaces to request a graph for
 * return: Returns the json (as a JavaScript Object) of the Kiali graph
 *
 ***** kialiParser.getJson = function(namespaces)
 *
 * getLink
 * Gets the Link to the Kiali graph
 * return: The link (as a string) to the Kiali graph
 ***** kialiParser.getLink = function()
 */



/*
 * Gets all services for a namespace, showing each services parents and children
 * param namespaces: Single namespace (String) or list (Array) of namespaces to request a graph for
 * param nparents: Number of parents to display (default=1)
 * param nchildren: Number of children to display (default=1)
 * return: Returns a list (string) of each service and their parents and children
 */
exports.getAll = function(namespaces, nparents, nchildren) {
    var nparents = nparents ? nparents : 1;
    var nchildren = nchildren ? nchildren : 1;
    var elements = exports.getJson(namespaces).elements;
    var nodes = parseJson(elements);
    var message = "";
    for (var key in nodes) {
        var node = nodes[key];
        var parentsOut = parentsToString(nodes, node, nparents);
        var childrenOut;
        if (!parentsOut) {
            childrenOut = childrenToString(nodes, node, 0, nchildren);
        } else {
            childrenOut = childrenToString(nodes, node, parentsOut[0], nchildren);
        }
        message += node.name + ":\n";
        if (!parentsOut) {
            message += "No Parents...\n";
        } else {
            message += parentsOut[1];
        }
        message += "<--[" + node.name + "]-->\n";
        if (!childrenOut) {
            message += "No Children...\n"
        } else {
            message += childrenOut[1];
        }
        message += "\n\n";
    }
    return message;
};


/*
 * Gets all the parents of a given node and returns a formatted string
 * param node: Node to get the parents of
 * param nparents: Number of generations of parents to get
 * return: formatted string of generations of parents
 */
var parentsToString = function(nodes, node, nparents) {
    if (!node.parents || node.parents.length === 0) {
        return null;
    }
    var nparents = nparents ? nparents : 1;
    var parents = [];
    var currentParents = [];
    // Push first generation of parents
    for (var i in node.parents) {
        parents.push(nodes[node.parents[i]].name);
        currentParents.push(node.parents[i]);
    }
    var gen = 1;
    // Loop through each generation, push current generation of
    // parents to the stack, then set the parents of the current
    // generation as the new current generation
    for (var i = 1; i < nparents; i ++) {
        // Break if there are no more parents left
        if (currentParents.length === 0) {
            break;
        }
        
        // Indicator for printing generation by generation
        parents.push(null);
        
        // Push current generation to parents stack (array)
        for (var j in currentParents) {
            console.log(JSON.stringify(nodes[currentParents[j]]))
            parents.push(nodes[currentParents[j]].name);
        }
        
        // Get the next generation of parents
        var newParents = [];
        for (var j in currentParents) {
            var nextParents = nodes[currentParents[j]].parents;
            for (var k in nextParents) {
                newParents.push(nextParents[k]);
            }
        }
        
        // Set the current generation to the next parents
        currentParents = newParents;
        gen ++;
    }
    
    // Loop through the parents stack and print each generation
    // of parents
    var parNum = gen;
    var out = "";
    prefix = ""
    for (var i = parents.length - 1; i >= 0; i --) {
        if (parents[i] === null) {
            prefix += "..";
            parNum --;
            continue;
        }
        out += prefix;
        out += "Gen " + parNum + " Parent: "+ parents[i] + "\n";
    }
    return [gen, out];
};


/*
 * Gets all the children of a given node and returns a formatted string
 * param node: Node to get the children of
 * param ntabs: Number of tabs to insert before each child
 * param nchildren: Number of generations of children to get
 * return: formatted string of generations of children
 */
var childrenToString = function(nodes, node, ntabs, nchildren) {
    if (!node.children || node.children.length === 0) {
        return null;
    }
    var nchildren = nchildren ? nchildren : 1;
    prefix = "";
    for (var i = 0; i < ntabs; i ++) {
        prefix += "..";
    }
    var children = [];
    var currentChildren = [];
    
    // Push first generation of children
    for (var i in node.children) {
        children.push(nodes[node.children[i]].name);
        currentChildren.push(node.children[i]);
    }
    
    var gen = 0;
    // Loop through each generation, push current generation of
    // children to the stack, then set the children of the current
    // generation as the new current generation
    for (var i = 1; i < nchildren; i ++) {
        
        // Break if there are no more parents left
        if (currentChildren.length === 0) {
            break;
        }
        
        // Indicator for printing generation by generation
        children.push(null);
        
        // Push current generation to parents stack (array)
        for (var j in currentChildren) {
            children.push(nodes[currentChildren[j]].name);
        }
        
        // Get the next generation of parents
        var newChildren = [];
        for (var j in currentChildren) {
            var nextChildren = nodes[currentChildren[j]].children;
            for (var k in nextChildren) {
                newChildren.push(nextChildren[k]);
            }
        }
        
        // Set the current generation to the next children
        currentChildren = newChildren;
        gen ++;
    }
    
    // Loop through the children stack and print each generation
    // of children
    var chNum = 1;
    var out = "";
    for (var i = 0; i < children.length; i ++) {
        if (children[i] === null) {
            prefix += ".."
            chNum ++;
            continue;
        }
        out += prefix;
        out += "Gen " + chNum + " Child: " + children[i] + "\n";
    }
    return [gen, out];
};

/*
 * Gets the parents and children for a given service in a namespace
 * param namespaces: Single namespace (String) or list (Array) of namespaces to request a graph for
 * param service: Name of the service to get
 * param nparents: Number of generations of parents to display (default=1)
 * param nchildren: Number of generations of children to display (default=1)
 * return: Returns a string showing all (or nparents & nchildren) the service's parents and children
 */
exports.getServiceRelations = function(namespaces, service, nparents, nchildren) {
    var nparents = nparents ? nparents : 1;
    var nchildren = nchildren ? nchildren : 1;
    var elements = exports.getJson(namespaces).elements;
    var nodes = parseJson(elements);
    var nameToId = {};
    var serviceNode = null;
    for (var node in nodes) {
        if (nodes[node].name === service) {
            serviceNode = nodes[node];
            break;
        }
    }
    if (service === null) {
        throw new Error("Service not found");
    }
    message = ""
    var parentsOut = parentsToString(nodes, serviceNode, nparents);
    var childrenOut;
    if (!parentsOut) {
        childrenOut = childrenToString(nodes, serviceNode, 0, nchildren);
    } else {
        childrenOut = childrenToString(nodes, serviceNode, parentsOut[0], nchildren);
    }
    message += serviceNode.name + ":\n";
    if (!parentsOut) {
        message += "No Parents...\n";
    } else {
        message += parentsOut[1];
    }
    message += "<--[" + serviceNode.name + "]-->\n";
    if (!childrenOut) {
        message += "No Children...\n"
    } else {
        message += childrenOut[1];
    }
    return message
};



/*
 * Gets the details for the given service, see example output at https://www.kiali.io/api/#operation/serviceDetails
 * param namespaces: Single namespace (String) or list (Array) of namespaces to request a graph for
 * param service: Name of the service to get
 * return: Returns the json of the service details
 */
exports.getServiceDetails = function(namespaces, service) {
    var pathStr = "";
    if (typeof namespaces === 'string') {
        pathStr = namespaces;
    } else if (namespaces.constructor === Array) {
        pathStr = namespaces[0];
        for (var i = 1; i < namespaces.length; i++) {
            pathStr += "," + namespaces[i];
        }
    } else {
        throw new Error("param `namespaces` must be of type String or Array");
    }
    var getKialiRequest = http.request({
        'endpoint': 'Kiali',
        'path': 'kiali/api/namespaces/' + pathStr + '/services/' + service,
        'method': 'GET'
    });
    response = getKialiRequest.write();
    if (response.statusCode === 200) {
        return JSON.parse(response.body);
    } else {
        throw new Error('Error retrieving service details. \
        Do you have the correct service and namespace?')
    }
};


/*
 * getHtml:
 * Gets the Kiali graph as an HTML table with a row for each service, with a column
 * containing a list of parent services, and a column containing a list of children services
 * param namespaces: Single namespace (String) or list (Array) of namespaces to request a graph for
 * param filterOn: A service name to filter the full graph on. Filters service name, parents and children
 * return: Returns the html of all services as a table
*/
exports.getHtml = function(namespaces, filterOn) {
    var elements = exports.getJson(namespaces).elements;
    var nodes = parseJson(elements);
    var html = '<table style="width:100%">\n';
    html += '\t<tr>\n';
    html += '\t\t<th>Service</th>\n';
    html += '\t\t<th>Parents</th>\n';
    html += '\t\t<th>Children</th>\n';
    html += '\t</tr>\n';
    var tmp;
    
    for (node in nodes) {
        tmp = '\t<tr>\n';
        tmp += '\t\t<td>' + nodes[node].name + '</td>\n';
        var parArr = [];
        for (var i in nodes[node].parents) {
            parArr.push(nodes[nodes[node].parents[i]].name);
        }
        var parStr = parArr.join( ', ' );
        
        tmp += '\t\t<td>' + parStr + '</td>\n';
        var chArr = [];
        for (var i in nodes[node].children) {
            chArr.push(nodes[nodes[node].children[i]].name);
        }
        var chStr = chArr.join( ', ' );
        
        tmp += '\t\t<td>' + chStr + '</td>\n';
        tmp += '\t</tr>\n';
        
        if( filterOn && ( 
              nodes[node].name == filterOn || 
              parArr.indexOf( filterOn ) > 0 ||
              chArr.indexOf(  filterOn ) > 0 
            ) )
                html += tmp;
    }
    html += '</table>';
    return html;

    
};





/*
 * Gets the JSON representation of a service graph
 * param namespaces: Single namespace (String) or list (Array) of namespaces to request a graph for
 * return: Returns the json (as a JavaScript Object) of the Kiali graph
 */
exports.getJson = function(namespaces) {
    var pathStr = "";
    if (typeof namespaces === 'string') {
        pathStr = namespaces;
    } else if (namespaces.constructor === Array) {
        pathStr = namespaces[0];
        for (var i = 1; i < namespaces.length; i++) {
            pathStr += "," + namespaces[i];
        }
    } else {
        throw new Error("param `namespaces` must be of type String or Array");
    }
    var getKialiRequest = http.request({
        'endpoint': 'Kiali',
        'path': 'kiali/api/namespaces/graph?namespaces=' + pathStr + '&graphType=service',
        'method': 'GET'
    });
    response = getKialiRequest.write();
    if (response.statusCode === 200) {
        return JSON.parse(response.body);
    } else {
        throw new Error('Error retrieving service graph from Kiali.\
        Do you have the correct namespace(s)?')
    }
};


/*
 * Gets the Link to the Kiali graph
 * return: The link (as a string) to the Kiali graph
 */
exports.getLink = function() {
    return constants['Kiali Endpoint'] + 'kiali/console/graph/namespaces?graphType=service';
}



/*
 * Helper function to parse kiali graph json into a simple JavaScript Object
 * param json: JSON representation of a Kiali graph
 * return: JavaScript Object of nodes where each node is keyed
 *         by the node ID and holds an object containing a name,
 *         children (list), and parents (list)
 */
var parseJson = function(elements) {
    var idToName = {};
    var nodes = {};
    for (i = 0; i < elements.nodes.length; i ++) {
        var node = elements.nodes[i];
        name = node.data.service ? node.data.service : node.data.app ? node.data.app : node.data.workload ? node.data.workload : 'unknown'
        if (!idToName[node.data.id]) {
            idToName[node.data.id] = name;
            nodes[name] = {'name': name, 'parents': [], 'children': []};
        }
    }
    for (i = 0; i < elements.edges.length; i ++) {
        var edge = elements.edges[i];
        if (idToName[edge.data.source] === idToName[edge.data.target]) {
            continue;
        }
        var sourceName = idToName[edge.data.source];
        var targetName = idToName[edge.data.target];
        if (nodes[sourceName].children.indexOf(targetName) === -1) {
            nodes[sourceName].children.push(targetName);
        }
        if (nodes[targetName].parents.indexOf(sourceName) === -1) {
            nodes[targetName].parents.push(sourceName);
        }
    }
    return nodes;
};

