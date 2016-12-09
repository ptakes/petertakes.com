using Autofac.Core;
using Microsoft.Extensions.Logging;

namespace Pta
{
    public class AutofacLogger : Autofac.Module
    {
        private readonly ILogger _logger;

        public AutofacLogger()
        {
            var loggerFactory = new LoggerFactory()
                .AddConsole(Startup.Current.Configuration.GetSection("Logging"));

            _logger = loggerFactory.CreateLogger<AutofacLogger>();
        }

        protected override void AttachToComponentRegistration(IComponentRegistry componentRegistry, IComponentRegistration registration)
        {
            if (_logger.IsEnabled(LogLevel.Debug))
            {
                registration.Preparing += (sender, args) => _logger.LogDebug("Resolving concrete type {0}", args.Component.Activator.LimitType);
            }
        }
    }
}