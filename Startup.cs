using System;
using System.Reflection;
using System.Text;
using Autofac;
using Autofac.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Pta.Api.Services;

namespace Pta
{
    public class Startup
    {
        public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true);

            if (env.IsDevelopment())
            {
                builder.AddUserSecrets();
            }

            builder.AddEnvironmentVariables();

            Configuration = builder.Build();

            Current = this;
        }

        public static Startup Current { get; private set; }

        public IConfigurationRoot Configuration { get; }

        public IContainer Container { get; private set; }

        public void Configure(IApplicationBuilder app, IApplicationLifetime appLifetime, ILoggerFactory loggerFactory)
        {
            appLifetime.ApplicationStopped.Register(() => Container.Dispose());
            loggerFactory.AddConsole(Configuration.GetSection("Logging"));

            app.UseResponseCompression();

            app.UseExceptionHandler(builder =>
            {
                builder.Run(async context =>
                {
                    context.Response.StatusCode = 500;
                    context.Response.ContentType = "application/json";

                    var error = context.Features.Get<IExceptionHandlerFeature>();
                    if (error != null)
                    {
                        var errorDto = new
                        {
                            Code = error.Error.HResult,
                            Message = error.Error.Message
                        };

                        await context.Response.WriteAsync(JsonConvert.SerializeObject(errorDto), Encoding.UTF8);
                    }
                });
            });

            var defaultFilesOptions = new DefaultFilesOptions();
            defaultFilesOptions.DefaultFileNames.Clear();
            defaultFilesOptions.DefaultFileNames.Add("index.html");

            app.UseDefaultFiles(defaultFilesOptions);
            app.UseStaticFiles();

            app.UseMvc();
        }

        public IServiceProvider ConfigureServices(IServiceCollection services)
        {
            services.AddLogging();

            services.AddOptions();
            services.Configure<GithubCredentials>(Configuration.GetSection("Github"));

            services.AddResponseCompression();

            var mvc = services.AddMvcCore();
            mvc.AddJsonFormatters(options => options.ContractResolver = new CamelCasePropertyNamesContractResolver());

            var builder = new ContainerBuilder();
            builder.Populate(services);
            builder.RegisterAssemblyModules(typeof(Startup).GetTypeInfo().Assembly);
            Container = builder.Build();
            return new AutofacServiceProvider(Container);
        }
    }
}
