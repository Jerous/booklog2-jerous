/**
 * SETUP
 **/
  var app = app || {};

/**
 * MODELS
 **/
app.Search = Backbone.Model.extend({  
  url: function() {
    return 'http://localhost:3000/1/post/tag/' + this.tag
  },
  tag: '',
  defaults: {
    success: false,
    errors: [],
    errfor: {},
    
    posts: [{
           "_id": '',
           "title": ''
       }]
  }
});

app.Post = Backbone.Model.extend({  
  url: function() {
    return 'http://localhost:3000/1/post' + this.query
  },
  query: '',
  defaults: {
    success: false,
    errors: [],
    errfor: {},
    
  	posts: [{
  	       "content": "hello",
  	       "_id": "5402de2f559097cdf139fff9",
  	       "title": "abc123"
  	   }]
  }
});

app.SinglePost = Backbone.Model.extend({  
  url: 'http://localhost:3000/1/post',
  defaults: {
    success: false,
    errors: [],
    errfor: {},

    content: '',
    title: ''
  }
});

app.PurchasePost = Backbone.Model.extend({  
  url: function() {
    return 'http://localhost:3000/1/post/' + this.attributes.id + '/pay'
  },
  defaults: {
    success: false,
    errors: [],
    errfor: {},
  }
});

/**
 * VIEWS
 **/
  app.FormView = Backbone.View.extend({
    el: '#form-section',
    events: {
      'submit form': 'preventSubmit',
      'click #btn-submit': 'performSubmit'
    },
    initialize: function() {
        this.model = new app.SinglePost();

        this.template = _.template($('#tmpl-form').html());
        this.model.bind('change', this.render, this); 

        this.render();       
    },
    render: function() {
        var data = this.template(this.model.attributes);

        this.$el.html(data);
        return this;
    },
    preventSubmit: function(event) {
        event.preventDefault();
    },
    performSubmit: function() {
      //關閉default behavier  因為表單中buttom按下預設會改變網址進行動作  而在此不希望改變網址的行為被秀出  所以關閉
      event.preventDefault(); 
    
      var title = this.$el.find('#title').val();
      var content = this.$el.find('#content').val();

      this.model.save({
        title: title,
        content: content
      });
      
      app.postView.model.fetch();
    }
  });

  app.SearchView = Backbone.View.extend({
    el: '#search-section',
    events: {
      'click .btn-search': 'performSearch'
    },
    initialize: function() {
        this.model = new app.Search();
        this.template = _.template($('#tmpl-results').html());

        this.model.bind('change', this.render, this);        
    },
    render: function() {
        var data = this.template(this.model.attributes);

        $('#search-result').html(data);

        return this;
    },
    performSearch: function() {
      var tag = this.$el.find('#search-tag').val();

      this.model.tag = tag;
      this.model.fetch();
    }
  });

  app.PostView = Backbone.View.extend({
  	el: '#blog-post',
    events: {
      'click .btn-filter': 'performFilter',
      'click .btn-format': 'performFormat',
      'click [data-purchase-for]': 'performPurchase'
    },
    initialize: function() {
        this.model = new app.Post();
        this.purchase = new app.PurchasePost();
        this.template = _.template($('#tmpl-post').html());

        this.model.bind('change', this.render, this);

        this.model.fetch();
    },
    render: function() {
        var data = this.template(this.model.attributes);

        this.$el.html(data);

        return this;
    },
    performFilter: function() {
        this.model.query = '?sort=date';
        this.model.fetch();
    },
    performFormat: function() {
        this.$el.find('.post-date').each(function () {
          var me = $(this);
          me.html( moment( me.text() ).fromNow() );
        });
    },
    performPurchase: function(event) {
        var me = this.$el.find(event.target);
        var postId = me.data('purchase-for');
        var self = this;

        this.purchase.set('id', postId);
        this.purchase.save(this.model.attributes, {
          success: function(model, response, options) {
            $.notify('訂購成功。等候付款！');
            self.model.fetch();
          },
          error: function(model, response, options) {
            $.notify('失敗')
          }
        });
    }
  });
  
  app.QueryView = Backbone.View.extend({
    el: '#search-section',
    events: {
      'click .btn-search': 'performSearch',
      //可在input欄位中隨KEY隨搜  查詢gooele: html5 input event
      'input #search-tag': 'performSearch'
    },
    initialize: function() {
        this.template = _.template($('#tmpl-query').html());
        this.render();        
    },
    render: function() {
        var data = this.template();
        this.$el.html(data);
        return this;
    },
    performSearch: function() {
      var tag = this.$el.find('#search-tag').val();

      app.postView.model.query = '/' + tag;
      app.postView.model.fetch();
    }
  });

/**
 * BOOTUP
 **/
  $(document).ready(function() {
    app.postView = new app.PostView();
    //app.searchView = new app.SearchView();
    app.formView = new app.FormView();
    app.queryView = new app.QueryView();
  });