const { ApolloServer, gql } = require('apollo-server');
const { RESTDataSource } = require('apollo-datasource-rest');

class ContentAPI extends RESTDataSource {
    constructor() {
        super();
        // Replace "labs" with your hub name
        this.baseURL = 'https://labs.cdn.content.amplience.net/';
    }

    async getContentByKey(key, depth) {
        const response = await this.get(`/content/key/${key}`, {depth: depth || 'root', format: 'inlined'});
        return response.content;
    }

    async getContentById(id, depth) {
        const response = await this.get(`/content/id/${id}`, {depth: depth || 'root', format: 'inlined'});
        return response.content;
    }
}


const typeDefs = gql`
  type NavigationLink {
      title: String
      href: String
  }

  type Navigation {
    links: [NavigationLink!]
  }

  type NavigationSlot {
      navigation: Navigation!
  }

  type ImageLink {
      name: String!
      endpoint: String!
      defaultHost: String!
  }

  type EditorialBlock {
      title: String
      description: String
  }

  type GalleryBlockItem {
      image: ImageLink
      callToAction: String
      callToActionHref: String
  }

  type GalleryBlock {
      title: String
      items: [GalleryBlockItem]
  }

  type HeroBannerBlock {
      image: ImageLink
      title: String
      description: String
      callToAction: String
      callToActionHref: String
  }

  union PageBlock = EditorialBlock | GalleryBlock | HeroBannerBlock

  type Page {
    components: [PageBlock]
  }

  type Query {
      navigation: Navigation!
      navigationSlot: NavigationSlot!
      homepage: Page
  }
`;

const resolvers = {
    Query: {
        navigation: (parent, args, { dataSources }) => {
            return dataSources.contentAPI.getContentByKey('component/navigation');
        },
        navigationSlot: (parent, args, { dataSources }) => {
            return dataSources.contentAPI.getContentByKey('slots/navigation');
        },
        homepage: (parent, args, { dataSources }) => {
            return dataSources.contentAPI.getContentByKey('slots/homepage', 'all');
        }
    },
    NavigationSlot: {
        navigation: (parent, args, { dataSources }) => {
            const id = parent.navigation.id;
            return dataSources.contentAPI.getContentById(id);
        }
    },
    PageBlock: {
        __resolveType: (obj, context, info) => {
            return obj.component;
        }
    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => {
        return {
            contentAPI: new ContentAPI()
        }
    }
});

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});